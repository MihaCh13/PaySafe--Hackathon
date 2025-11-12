from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import MarketplaceListing, MarketplaceOrder, Wallet, Transaction, User
from app.utils.validators import MarketplaceListingSchema, sanitize_html, validate_base64_image
from marshmallow import ValidationError
from datetime import datetime
from decimal import Decimal

marketplace_bp = Blueprint('marketplace', __name__)


def lock_wallets_deterministic(user_id_1, user_id_2):
    """
    Lock two user wallets in deterministic order to prevent deadlocks.
    Always locks lower user_id first, then higher user_id.
    
    Returns:
        tuple: (wallet1, wallet2) where wallet1 belongs to user_id_1
    """
    # Sort user IDs to ensure consistent locking order
    if user_id_1 < user_id_2:
        wallet1 = Wallet.query.filter_by(user_id=user_id_1).with_for_update().first()
        wallet2 = Wallet.query.filter_by(user_id=user_id_2).with_for_update().first()
        return wallet1, wallet2
    else:
        wallet2 = Wallet.query.filter_by(user_id=user_id_2).with_for_update().first()
        wallet1 = Wallet.query.filter_by(user_id=user_id_1).with_for_update().first()
        return wallet1, wallet2

@marketplace_bp.route('/listings', methods=['GET'])
@jwt_required()
def get_listings():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    category = request.args.get('category')
    university = request.args.get('university')
    
    query = MarketplaceListing.query.filter_by(is_available=True, is_sold=False)
    
    if category:
        query = query.filter_by(category=category)
    if university:
        query = query.filter_by(university=university)
    
    query = query.order_by(MarketplaceListing.created_at.desc())
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'listings': [listing.to_dict(include_seller=True) for listing in pagination.items],
        'total': pagination.total,
        'page': page,
        'pages': pagination.pages
    }), 200

@marketplace_bp.route('/listings', methods=['POST'])
@jwt_required()
def create_listing():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    # Validate input using Marshmallow schema
    try:
        schema = MarketplaceListingSchema()
        validated_data = schema.load(data)
    except ValidationError as e:
        current_app.logger.warning(f"Marketplace listing validation failed for user {user_id}: {e.messages}")
        return jsonify({'error': 'Validation failed', 'details': e.messages}), 400
    
    # Sanitize text fields
    title = sanitize_html(validated_data['title'])
    description = sanitize_html(validated_data['description'])
    university = sanitize_html(data.get('university', '')) if data.get('university') else None
    faculty = sanitize_html(data.get('faculty', '')) if data.get('faculty') else None
    course = sanitize_html(data.get('course', '')) if data.get('course') else None
    condition = sanitize_html(data.get('condition', '')) if data.get('condition') else None
    
    # Validate images (base64 encoded)
    images = data.get('images', [])
    validated_images = []
    if images:
        for idx, img in enumerate(images):
            if isinstance(img, str) and img:  # Only validate non-empty strings
                is_valid, error_msg = validate_base64_image(img)
                if not is_valid:
                    current_app.logger.warning(f"Invalid image {idx} for listing by user {user_id}: {error_msg}")
                    return jsonify({'error': f'Invalid image {idx + 1}: {error_msg}'}), 400
                validated_images.append(img)
    
    listing = MarketplaceListing(
        seller_id=user_id,
        title=title,
        description=description,
        category=validated_data['category'],
        price=validated_data['price'],
        university=university,
        faculty=faculty,
        course=course,
        condition=condition,
        images=validated_images  # Now validated!
    )
    
    db.session.add(listing)
    db.session.commit()
    
    current_app.logger.info(f"Marketplace listing created: {title} by user {user_id}")
    
    return jsonify({
        'message': 'Listing created successfully',
        'listing': listing.to_dict()
    }), 201

@marketplace_bp.route('/listings/<int:listing_id>', methods=['GET'])
@jwt_required()
def get_listing(listing_id):
    listing = MarketplaceListing.query.get(listing_id)
    
    if not listing:
        return jsonify({'error': 'Listing not found'}), 404
    
    return jsonify({'listing': listing.to_dict(include_seller=True)}), 200

@marketplace_bp.route('/orders', methods=['POST'])
@jwt_required()
def create_order():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    listing_id = data.get('listing_id')
    
    # Lock listing to prevent concurrent purchases
    listing = MarketplaceListing.query.filter_by(id=listing_id).with_for_update().first()
    
    if not listing:
        return jsonify({'error': 'Listing not found'}), 404
    
    if not listing.is_available or listing.is_sold:
        return jsonify({'error': 'Listing not available'}), 400
    
    # Prevent seller from buying their own listing
    if listing.seller_id == user_id:
        return jsonify({'error': 'Cannot purchase your own listing'}), 400
    
    try:
        price_decimal = Decimal(str(listing.price))
        
        # Lock both wallets in deterministic order to prevent deadlocks
        buyer_wallet, seller_wallet = lock_wallets_deterministic(user_id, listing.seller_id)
        
        if not buyer_wallet:
            return jsonify({'error': 'Buyer wallet not found'}), 404
        
        if not seller_wallet:
            return jsonify({'error': 'Seller wallet not found'}), 404
        
        # Check buyer balance
        if buyer_wallet.balance < price_decimal:
            return jsonify({'error': 'Insufficient wallet balance'}), 400
        
        # Deduct from buyer wallet
        buyer_wallet.balance -= price_decimal
        
        # Create order with 'paid' status
        order = MarketplaceOrder(
            listing_id=listing_id,
            buyer_id=user_id,
            amount=listing.price,
            status='paid',
            escrow_released=True  # Immediate escrow release (single-phase)
        )
        db.session.add(order)
        db.session.flush()  # Get order ID before creating transactions
        
        # Create purchase transaction for buyer
        purchase_transaction = Transaction(
            user_id=user_id,
            transaction_type='purchase',
            transaction_source='main_wallet',
            amount=float(price_decimal),
            status='completed',
            description=f'Purchased: {listing.title}',
            transaction_metadata={
                'listing_id': listing.id,
                'order_id': order.id,
                'seller_id': listing.seller_id,
                'listing_title': listing.title
            },
            completed_at=datetime.utcnow()
        )
        db.session.add(purchase_transaction)
        
        # Credit seller wallet (immediate escrow release)
        
        seller_wallet.balance += price_decimal
        
        # Create income transaction for seller
        sale_transaction = Transaction(
            user_id=listing.seller_id,
            transaction_type='sale',
            transaction_source='main_wallet',
            amount=float(price_decimal),
            status='completed',
            description=f'Sold: {listing.title}',
            transaction_metadata={
                'listing_id': listing.id,
                'order_id': order.id,
                'buyer_id': user_id,
                'listing_title': listing.title
            },
            completed_at=datetime.utcnow()
        )
        db.session.add(sale_transaction)
        
        # Mark listing as sold
        listing.is_sold = True
        listing.is_available = False
        
        db.session.commit()
        
        return jsonify({
            'message': 'Purchase successful! Order created and seller has been paid.',
            'order': order.to_dict(),
            'transaction': purchase_transaction.to_dict(),
            'wallet_balance': float(buyer_wallet.balance)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Purchase failed: {str(e)}'}), 500

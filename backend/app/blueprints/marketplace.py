from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import MarketplaceListing, MarketplaceOrder, Wallet, Transaction, User
from datetime import datetime
from decimal import Decimal

marketplace_bp = Blueprint('marketplace', __name__)

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
    
    listing = MarketplaceListing(
        seller_id=user_id,
        title=data.get('title'),
        description=data.get('description'),
        category=data.get('category'),
        price=data.get('price'),
        university=data.get('university'),
        faculty=data.get('faculty'),
        course=data.get('course'),
        condition=data.get('condition'),
        images=data.get('images', [])
    )
    
    db.session.add(listing)
    db.session.commit()
    
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
        # Lock buyer wallet
        buyer_wallet = Wallet.query.filter_by(user_id=user_id).with_for_update().first()
        if not buyer_wallet:
            return jsonify({'error': 'Wallet not found'}), 404
        
        # Check buyer balance
        price_decimal = Decimal(str(listing.price))
        if buyer_wallet.balance < price_decimal:
            return jsonify({'error': 'Insufficient wallet balance'}), 400
        
        # Deduct from buyer wallet
        buyer_wallet.balance -= price_decimal
        
        # Create order with 'paid' status
        order = MarketplaceOrder(
            listing_id=listing_id,
            buyer_id=user_id,
            amount=listing.price,
            status='paid'
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
        
        # Credit seller wallet (escrow release)
        seller_wallet = Wallet.query.filter_by(user_id=listing.seller_id).with_for_update().first()
        if not seller_wallet:
            db.session.rollback()
            return jsonify({'error': 'Seller wallet not found. Purchase cancelled.'}), 500
        
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

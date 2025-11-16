from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import VirtualCard, Subscription, Wallet, Transaction
from app.services import SubscriptionSchedulerService
from datetime import datetime, timedelta

cards_bp = Blueprint('cards', __name__)

# Budget Card Categories
BUDGET_CATEGORIES = [
    'food', 'rent', 'utilities', 'transport', 'subscriptions',
    'entertainment', 'shopping', 'health', 'education', 'savings', 'other'
]

CATEGORY_ICONS = {
    'food': '🍔', 'rent': '🏠', 'utilities': '💡', 'transport': '🚗',
    'subscriptions': '📱', 'entertainment': '🎬', 'shopping': '🛍️',
    'health': '⚕️', 'education': '📚', 'savings': '💰', 'other': '💳'
}

CATEGORY_COLORS = {
    'food': '#ef4444', 'rent': '#3b82f6', 'utilities': '#f97316', 'transport': '#8b5cf6',
    'subscriptions': '#ec4899', 'entertainment': '#14b8a6', 'shopping': '#f97316',
    'health': '#10b981', 'education': '#6366f1', 'savings': '#22c55e', 'other': '#64748b'
}

# Subscription Catalog (moved from subscriptions blueprint)
SUBSCRIPTION_CATALOG = [
    {
        'id': 'spotify-premium',
        'service_name': 'Spotify Premium',
        'category': 'streaming',
        'monthly_cost': 9.99,
        'description': 'Ad-free music streaming with offline downloads',
        'icon_url': 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/spotify.svg',
        'color': '#1DB954'
    },
    {
        'id': 'netflix-standard',
        'service_name': 'Netflix Standard',
        'category': 'streaming',
        'monthly_cost': 15.49,
        'description': 'HD streaming on 2 screens simultaneously',
        'icon_url': 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/netflix.svg',
        'color': '#E50914'
    },
    {
        'id': 'youtube-premium',
        'service_name': 'YouTube Premium',
        'category': 'streaming',
        'monthly_cost': 11.99,
        'description': 'Ad-free videos, background play, and YouTube Music',
        'icon_url': 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/youtube.svg',
        'color': '#FF0000'
    },
    {
        'id': 'apple-music',
        'service_name': 'Apple Music',
        'category': 'streaming',
        'monthly_cost': 10.99,
        'description': 'Access to 100 million songs',
        'icon_url': 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/applemusic.svg',
        'color': '#FA243C'
    },
    {
        'id': 'disney-plus',
        'service_name': 'Disney+',
        'category': 'streaming',
        'monthly_cost': 7.99,
        'description': 'Disney, Pixar, Marvel, Star Wars & National Geographic',
        'icon_url': 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/disneyplus.svg',
        'color': '#113CCF'
    },
]

@cards_bp.route('', methods=['GET'], strict_slashes=False)
@jwt_required()
def get_cards():
    user_id = int(get_jwt_identity())
    card_purpose = request.args.get('card_purpose')  # 'payment', 'budget', or None (all)
    
    query = VirtualCard.query.filter_by(user_id=user_id)
    if card_purpose:
        query = query.filter_by(card_purpose=card_purpose)
    
    cards = query.order_by(VirtualCard.created_at.desc()).all()
    
    # Calculate summary for budget cards
    budget_cards = [c for c in cards if c.card_purpose == 'budget']
    subscription_cards = [c for c in cards if c.card_purpose == 'subscription']
    total_allocated = sum(float(c.allocated_amount) for c in budget_cards)
    total_spent = sum(float(c.spent_amount) for c in budget_cards)
    
    # Calculate subscription summary
    total_monthly_subscription = sum(
        sum(float(sub.amount) for sub in c.subscriptions.filter_by(is_active=True, billing_cycle='monthly').all())
        for c in subscription_cards
    )
    
    return jsonify({
        'cards': [card.to_dict() for card in cards],
        'summary': {
            'total_allocated': total_allocated,
            'total_spent': total_spent,
            'total_remaining': total_allocated - total_spent,
            'card_count': len(cards),
            'payment_card_count': len([c for c in cards if c.card_purpose == 'payment']),
            'budget_card_count': len(budget_cards),
            'subscription_card_count': len(subscription_cards),
            'total_monthly_subscription': total_monthly_subscription
        }
    }), 200

@cards_bp.route('/subscription-card', methods=['GET'], strict_slashes=False)
@jwt_required()
def get_or_create_subscription_card():
    """Get user's subscription card, auto-creating if it doesn't exist"""
    user_id = int(get_jwt_identity())
    
    # Check if user already has a subscription card
    subscription_card = VirtualCard.query.filter_by(
        user_id=user_id,
        card_purpose='subscription'
    ).first()
    
    # Auto-create if doesn't exist
    if not subscription_card:
        subscription_card = VirtualCard(
            user_id=user_id,
            card_purpose='subscription',
            card_name='My Subscriptions',
            category='subscriptions',
            color='#ec4899',
            icon='📱',
            allocated_amount=VirtualCard.to_decimal(0),
            spent_amount=VirtualCard.to_decimal(0)
        )
        db.session.add(subscription_card)
        db.session.commit()
    
    return jsonify(subscription_card.to_dict()), 200

@cards_bp.route('/default-cards', methods=['GET'], strict_slashes=False)
@jwt_required()
def get_or_create_default_cards():
    """Get or auto-create default payment cards (Standard Digital Card and One-Time Card)"""
    user_id = int(get_jwt_identity())
    
    # Check if user already has default cards
    standard_card = VirtualCard.query.filter_by(
        user_id=user_id,
        card_purpose='payment',
        card_type='standard',
        card_name='Standard Digital Card'
    ).first()
    
    one_time_card = VirtualCard.query.filter_by(
        user_id=user_id,
        card_purpose='payment',
        card_type='virtual',
        card_name='One-Time Card'
    ).first()
    
    created = []
    
    # Auto-create standard card if doesn't exist
    if not standard_card:
        standard_card = VirtualCard(
            user_id=user_id,
            card_purpose='payment',
            card_type='standard',
            card_name='Standard Digital Card',
            card_number=VirtualCard.generate_card_number(),
            cvv=VirtualCard.generate_cvv(),
            expiry_date=(datetime.utcnow() + timedelta(days=1095)).date(),
            is_frozen=False
        )
        db.session.add(standard_card)
        created.append('Standard Digital Card')
    
    # Auto-create one-time card if doesn't exist
    if not one_time_card:
        one_time_card = VirtualCard(
            user_id=user_id,
            card_purpose='payment',
            card_type='virtual',
            card_name='One-Time Card',
            card_number=VirtualCard.generate_card_number(),
            cvv=VirtualCard.generate_cvv(),
            expiry_date=(datetime.utcnow() + timedelta(days=1095)).date(),
            is_frozen=False
        )
        db.session.add(one_time_card)
        created.append('One-Time Card')
    
    if created:
        db.session.commit()
    
    return jsonify({
        'cards': [
            standard_card.to_dict(include_sensitive=True),
            one_time_card.to_dict(include_sensitive=True)
        ],
        'created': created,
        'message': f'Default cards ready. Created: {", ".join(created)}' if created else 'Default cards already exist'
    }), 200

@cards_bp.route('/<int:card_id>/catalog', methods=['GET'], strict_slashes=False)
@jwt_required()
def get_subscription_catalog(card_id):
    """Get subscription catalog for a subscription card"""
    user_id = int(get_jwt_identity())
    
    # Verify card belongs to user and is subscription card
    card = VirtualCard.query.filter_by(id=card_id, user_id=user_id).first()
    if not card:
        return jsonify({'error': 'Card not found'}), 404
    
    if card.card_purpose != 'subscription':
        return jsonify({'error': 'This endpoint is only for subscription cards'}), 400
    
    # Filter catalog based on query params
    category = request.args.get('category')
    catalog = SUBSCRIPTION_CATALOG
    
    if category:
        catalog = [item for item in catalog if item['category'] == category]
    
    return jsonify({'catalog': catalog}), 200

@cards_bp.route('', methods=['POST'], strict_slashes=False)
@jwt_required()
def create_card():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    card_purpose = data.get('card_purpose', 'payment')
    card_name = data.get('card_name', 'New Card')
    
    if card_purpose == 'payment':
        # Create payment card
        card = VirtualCard(
            user_id=user_id,
            card_purpose='payment',
            card_type=data.get('card_type', 'standard'),
            card_name=card_name,
            card_number=VirtualCard.generate_card_number(),
            cvv=VirtualCard.generate_cvv(),
            expiry_date=(datetime.utcnow() + timedelta(days=1095)).date(),
            spending_limit=data.get('spending_limit')
        )
    elif card_purpose == 'budget':
        # Create budget card with zero allocation (users must allocate funds separately via /allocate endpoint)
        category = data.get('category', 'other')
        if category not in BUDGET_CATEGORIES:
            return jsonify({'error': f'Invalid category. Must be one of: {", ".join(BUDGET_CATEGORIES)}'}), 400
        
        card = VirtualCard(
            user_id=user_id,
            card_purpose='budget',
            card_name=card_name,
            category=category,
            color=data.get('color', CATEGORY_COLORS.get(category, '#6366f1')),
            icon=data.get('icon', CATEGORY_ICONS.get(category, '💳')),
            allocated_amount=VirtualCard.to_decimal(0),  # Always start with 0, use /allocate to add funds
            spent_amount=VirtualCard.to_decimal(0),
            monthly_limit=VirtualCard.to_decimal(data['monthly_limit']) if data.get('monthly_limit') is not None else None,
            auto_allocate=data.get('auto_allocate', False),
            auto_allocate_amount=VirtualCard.to_decimal(data['auto_allocate_amount']) if data.get('auto_allocate_amount') is not None else None
        )
    elif card_purpose == 'subscription':
        # Create subscription card for managing subscriptions
        category = data.get('category', 'subscriptions')
        
        card = VirtualCard(
            user_id=user_id,
            card_purpose='subscription',
            card_name=card_name,
            category=category,
            color=data.get('color', '#ec4899'),  # Pink color for subscriptions
            icon=data.get('icon', '📱'),
            allocated_amount=VirtualCard.to_decimal(0),
            spent_amount=VirtualCard.to_decimal(0)
        )
    else:
        return jsonify({'error': 'Invalid card_purpose. Must be "payment", "budget", or "subscription"'}), 400
    
    db.session.add(card)
    db.session.commit()
    
    card_type_name = {'payment': 'Payment', 'budget': 'Budget', 'subscription': 'Subscription'}.get(card_purpose, 'Card')
    return jsonify({
        'message': f'{card_type_name} card created successfully',
        'card': card.to_dict(include_sensitive=(card_purpose == 'payment'))
    }), 201

@cards_bp.route('/<int:card_id>', methods=['GET'])
@jwt_required()
def get_card(card_id):
    user_id = int(get_jwt_identity())
    card = VirtualCard.query.filter_by(id=card_id, user_id=user_id).first()
    
    if not card:
        return jsonify({'error': 'Card not found'}), 404
    
    return jsonify({'card': card.to_dict(include_sensitive=True)}), 200

@cards_bp.route('/<int:card_id>/freeze', methods=['POST'])
@jwt_required()
def freeze_card(card_id):
    user_id = int(get_jwt_identity())
    card = VirtualCard.query.filter_by(id=card_id, user_id=user_id).first()
    
    if not card:
        return jsonify({'error': 'Card not found'}), 404
    
    card.is_frozen = True
    db.session.commit()
    
    return jsonify({'message': 'Card frozen successfully', 'card': card.to_dict()}), 200

@cards_bp.route('/<int:card_id>/unfreeze', methods=['POST'])
@jwt_required()
def unfreeze_card(card_id):
    user_id = int(get_jwt_identity())
    card = VirtualCard.query.filter_by(id=card_id, user_id=user_id).first()
    
    if not card:
        return jsonify({'error': 'Card not found'}), 404
    
    card.is_frozen = False
    db.session.commit()
    
    return jsonify({'message': 'Card unfrozen successfully', 'card': card.to_dict()}), 200

@cards_bp.route('/<int:card_id>/subscriptions', methods=['GET'])
@jwt_required()
def get_card_subscriptions(card_id):
    user_id = int(get_jwt_identity())
    card = VirtualCard.query.filter_by(id=card_id, user_id=user_id).first()
    
    if not card:
        return jsonify({'error': 'Card not found'}), 404
    
    subscriptions = Subscription.query.filter_by(card_id=card_id).all()
    
    return jsonify({
        'subscriptions': [sub.to_dict() for sub in subscriptions]
    }), 200

@cards_bp.route('/<int:card_id>/subscriptions', methods=['POST'])
@jwt_required()
def add_subscription(card_id):
    user_id = int(get_jwt_identity())
    card = VirtualCard.query.filter_by(id=card_id, user_id=user_id).first()
    
    if not card:
        return jsonify({'error': 'Card not found'}), 404
    
    data = request.get_json()
    
    service_name = data.get('service_name')
    amount = data.get('amount')
    billing_cycle = data.get('billing_cycle', 'monthly')
    next_billing_date_str = data.get('next_billing_date')
    
    next_billing_date = datetime.fromisoformat(next_billing_date_str).date() if next_billing_date_str else None
    
    existing_sub = Subscription.query.filter_by(
        card_id=card_id,
        service_name=service_name,
        is_active=True
    ).first()
    
    if existing_sub:
        return jsonify({'error': 'Subscription already exists for this service'}), 409
    
    subscription = Subscription(
        card_id=card_id,
        service_name=service_name,
        service_category=data.get('service_category'),
        amount=amount,
        billing_cycle=billing_cycle,
        next_billing_date=next_billing_date
    )
    
    db.session.add(subscription)
    db.session.flush()
    
    if next_billing_date:
        next_billing_datetime = datetime.combine(next_billing_date, datetime.min.time())
        
        scheduled_transaction = Transaction(
            user_id=user_id,
            transaction_type='subscription_payment',
            transaction_source='budget_card',
            amount=float(amount),
            status='scheduled',
            description=f'{service_name} - {billing_cycle} subscription',
            transaction_metadata={
                'source': 'SUBSCRIPTION_PAYMENT',
                'subscription_id': subscription.id,
                'card_id': card_id,
                'billing_cycle': billing_cycle,
                'scheduled': True,
                'upcoming': True,
                'category': data.get('service_category', 'subscription'),
                'display_color': '#FACC15'
            },
            created_at=next_billing_datetime
        )
        
        db.session.add(scheduled_transaction)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Subscription added successfully',
        'subscription': subscription.to_dict()
    }), 201

# Budget Card Specific Endpoints

@cards_bp.route('/<int:card_id>/allocate', methods=['POST'])
@jwt_required()
def allocate_funds(card_id):
    """Allocate funds from wallet to budget card"""
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    if not data or not data.get('amount'):
        return jsonify({'error': 'Amount is required'}), 400
    
    amount_decimal = VirtualCard.to_decimal(data['amount'])
    if amount_decimal <= 0:
        return jsonify({'error': 'Amount must be greater than 0'}), 400
    
    try:
        card = VirtualCard.query.filter_by(id=card_id, user_id=user_id).with_for_update().first()
        if not card:
            return jsonify({'error': 'Card not found'}), 404
        
        if card.card_purpose != 'budget':
            return jsonify({'error': 'Can only allocate funds to budget cards'}), 400
        
        wallet = Wallet.query.filter_by(user_id=user_id).with_for_update().first()
        if not wallet:
            return jsonify({'error': 'Wallet not found'}), 404
        
        if wallet.balance < amount_decimal:
            return jsonify({'error': 'Insufficient wallet balance'}), 400
        
        wallet.balance -= amount_decimal
        card.allocate(amount_decimal)
        
        transaction = Transaction(
            user_id=user_id,
            transaction_type='budget_allocation',
            transaction_source='budget_card',
            amount=float(amount_decimal),
            status='completed',
            description=f'Allocated ${amount_decimal:.2f} to {card.card_name}',
            transaction_metadata={'card_id': card.id, 'card_name': card.card_name},
            completed_at=datetime.utcnow()
        )
        db.session.add(transaction)
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully allocated ${amount_decimal:.2f} to {card.card_name}',
            'card': card.to_dict(),
            'wallet_balance': float(wallet.balance)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Transaction failed: {str(e)}'}), 500

@cards_bp.route('/<int:card_id>/spend', methods=['POST'])
@jwt_required()
def spend_from_card(card_id):
    """Record spending from budget card"""
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    if not data or not data.get('amount'):
        return jsonify({'error': 'Amount is required'}), 400
    
    amount_decimal = VirtualCard.to_decimal(data['amount'])
    description = data.get('description', 'Budget card expense')
    
    if amount_decimal <= 0:
        return jsonify({'error': 'Amount must be greater than 0'}), 400
    
    try:
        card = VirtualCard.query.filter_by(id=card_id, user_id=user_id).with_for_update().first()
        if not card:
            return jsonify({'error': 'Card not found'}), 404
        
        if card.card_purpose != 'budget':
            return jsonify({'error': 'Can only spend from budget cards'}), 400
        
        card.spend(amount_decimal)
        
        transaction = Transaction(
            user_id=user_id,
            transaction_type='budget_expense',
            transaction_source='budget_card',
            amount=float(amount_decimal),
            status='completed',
            description=description,
            transaction_metadata={
                'card_id': card.id,
                'card_name': card.card_name,
                'category': card.category
            },
            completed_at=datetime.utcnow()
        )
        db.session.add(transaction)
        db.session.commit()
        
        return jsonify({
            'message': f'Spent ${amount_decimal:.2f} from {card.card_name}',
            'card': card.to_dict()
        }), 200
        
    except ValueError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Transaction failed: {str(e)}'}), 500

@cards_bp.route('/<int:card_id>/withdraw', methods=['POST'])
@jwt_required()
def withdraw_from_card(card_id):
    """Withdraw funds from budget card back to wallet"""
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    if not data or not data.get('amount'):
        return jsonify({'error': 'Amount is required'}), 400
    
    amount_decimal = VirtualCard.to_decimal(data['amount'])
    if amount_decimal <= 0:
        return jsonify({'error': 'Amount must be greater than 0'}), 400
    
    try:
        card = VirtualCard.query.filter_by(id=card_id, user_id=user_id).with_for_update().first()
        if not card:
            return jsonify({'error': 'Card not found'}), 404
        
        if card.card_purpose != 'budget':
            return jsonify({'error': 'Can only withdraw from budget cards'}), 400
        
        remaining = card.allocated_amount - card.spent_amount
        if remaining < amount_decimal:
            return jsonify({'error': f'Insufficient unspent budget. Available: ${float(remaining):.2f}'}), 400
        
        wallet = Wallet.query.filter_by(user_id=user_id).with_for_update().first()
        if not wallet:
            return jsonify({'error': 'Wallet not found'}), 404
        
        card.allocated_amount -= amount_decimal
        if card.allocated_amount < card.spent_amount:
            db.session.rollback()
            return jsonify({'error': 'Cannot withdraw: would create negative balance'}), 400
        
        wallet.balance += amount_decimal
        card.updated_at = datetime.utcnow()
        
        transaction = Transaction(
            user_id=user_id,
            transaction_type='budget_withdrawal',
            transaction_source='budget_card',
            amount=float(amount_decimal),
            status='completed',
            description=f'Withdrawn ${amount_decimal:.2f} from {card.card_name} back to wallet',
            transaction_metadata={'card_id': card.id, 'card_name': card.card_name},
            completed_at=datetime.utcnow()
        )
        db.session.add(transaction)
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully withdrawn ${amount_decimal:.2f} back to wallet',
            'card': card.to_dict(),
            'wallet_balance': float(wallet.balance)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Transaction failed: {str(e)}'}), 500

@cards_bp.route('/<int:card_id>/pay', methods=['POST'])
@jwt_required()
def process_payment(card_id):
    """Process a payment using a payment card"""
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    if not data or not data.get('amount'):
        return jsonify({'error': 'Amount is required'}), 400
    
    amount_decimal = VirtualCard.to_decimal(data['amount'])
    merchant = data.get('merchant', 'Unknown Merchant')
    description = data.get('description', f'Payment to {merchant}')
    
    if amount_decimal <= 0:
        return jsonify({'error': 'Amount must be greater than 0'}), 400
    
    try:
        # Lock card row
        card = VirtualCard.query.filter_by(id=card_id, user_id=user_id).with_for_update().first()
        if not card:
            return jsonify({'error': 'Card not found'}), 404
        
        if card.card_purpose != 'payment':
            return jsonify({'error': 'This endpoint is only for payment cards'}), 400
        
        # Check if card is frozen
        if card.is_frozen:
            return jsonify({'error': 'Card is frozen. Unfreeze it to make payments'}), 403
        
        # Lock wallet row
        wallet = Wallet.query.filter_by(user_id=user_id).with_for_update().first()
        if not wallet:
            return jsonify({'error': 'Wallet not found'}), 404
        
        # Check wallet balance
        if wallet.balance < amount_decimal:
            return jsonify({'error': 'Insufficient wallet balance'}), 400
        
        # Check spending limit if set
        if card.spending_limit is not None:
            if card.spent_amount + amount_decimal > card.spending_limit:
                return jsonify({
                    'error': f'Payment exceeds spending limit. Available: ${float(card.spending_limit - card.spent_amount):.2f}'
                }), 400
        
        # Process payment
        wallet.balance -= amount_decimal
        card.spent_amount = (card.spent_amount or VirtualCard.to_decimal(0)) + amount_decimal
        card.updated_at = datetime.utcnow()
        
        # Create transaction record
        transaction = Transaction(
            user_id=user_id,
            transaction_type='card_payment',
            transaction_source='main_wallet',
            amount=float(amount_decimal),
            status='completed',
            description=description,
            transaction_metadata={
                'card_id': card.id,
                'card_name': card.card_name,
                'card_type': card.card_type,
                'merchant': merchant
            },
            completed_at=datetime.utcnow()
        )
        db.session.add(transaction)
        db.session.commit()
        
        return jsonify({
            'message': f'Payment of ${amount_decimal:.2f} successful',
            'card': card.to_dict(),
            'wallet_balance': float(wallet.balance),
            'transaction': transaction.to_dict()
        }), 200
        
    except ValueError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Payment failed: {str(e)}'}), 500

@cards_bp.route('/categories', methods=['GET'])
@jwt_required()
def get_categories():
    """Get available budget categories"""
    return jsonify({
        'categories': [
            {
                'value': cat,
                'label': cat.capitalize(),
                'icon': CATEGORY_ICONS.get(cat, '💳'),
                'color': CATEGORY_COLORS.get(cat, '#6366f1')
            }
            for cat in BUDGET_CATEGORIES
        ]
    }), 200

# Extended Subscription Management Endpoints

@cards_bp.route('/<int:card_id>/subscriptions/<int:sub_id>', methods=['PUT'])
@jwt_required()
def update_subscription(card_id, sub_id):
    """Update a subscription"""
    user_id = int(get_jwt_identity())
    card = VirtualCard.query.filter_by(id=card_id, user_id=user_id).first()
    
    if not card:
        return jsonify({'error': 'Card not found'}), 404
    
    subscription = Subscription.query.filter_by(id=sub_id, card_id=card_id).first()
    if not subscription:
        return jsonify({'error': 'Subscription not found'}), 404
    
    data = request.get_json()
    
    if 'service_name' in data:
        subscription.service_name = data['service_name']
    if 'service_category' in data:
        subscription.service_category = data['service_category']
    if 'amount' in data:
        subscription.amount = data['amount']
    if 'billing_cycle' in data:
        subscription.billing_cycle = data['billing_cycle']
    if 'next_billing_date' in data:
        subscription.next_billing_date = datetime.fromisoformat(data['next_billing_date']).date()
    
    db.session.commit()
    
    return jsonify({
        'message': 'Subscription updated successfully',
        'subscription': subscription.to_dict()
    }), 200

@cards_bp.route('/<int:card_id>/subscriptions/<int:sub_id>', methods=['DELETE'])
@jwt_required()
def delete_subscription(card_id, sub_id):
    """Delete a subscription"""
    user_id = int(get_jwt_identity())
    card = VirtualCard.query.filter_by(id=card_id, user_id=user_id).first()
    
    if not card:
        return jsonify({'error': 'Card not found'}), 404
    
    subscription = Subscription.query.filter_by(id=sub_id, card_id=card_id).first()
    if not subscription:
        return jsonify({'error': 'Subscription not found'}), 404
    
    scheduled_transaction = Transaction.query.filter(
        Transaction.user_id == user_id,
        Transaction.status == 'scheduled',
        Transaction.transaction_metadata['subscription_id'].astext == str(sub_id)
    ).first()
    
    if scheduled_transaction:
        db.session.delete(scheduled_transaction)
    
    db.session.delete(subscription)
    db.session.commit()
    
    return jsonify({'message': 'Subscription deleted successfully'}), 200

@cards_bp.route('/<int:card_id>/subscriptions/<int:sub_id>/pause', methods=['POST'])
@jwt_required()
def pause_subscription(card_id, sub_id):
    """Pause a subscription"""
    user_id = int(get_jwt_identity())
    card = VirtualCard.query.filter_by(id=card_id, user_id=user_id).first()
    
    if not card:
        return jsonify({'error': 'Card not found'}), 404
    
    subscription = Subscription.query.filter_by(id=sub_id, card_id=card_id).first()
    if not subscription:
        return jsonify({'error': 'Subscription not found'}), 404
    
    scheduled_transaction = Transaction.query.filter(
        Transaction.user_id == user_id,
        Transaction.status == 'scheduled',
        Transaction.transaction_metadata['subscription_id'].astext == str(sub_id)
    ).first()
    
    if scheduled_transaction:
        db.session.delete(scheduled_transaction)
    
    subscription.is_active = False
    db.session.commit()
    
    return jsonify({
        'message': 'Subscription paused successfully',
        'subscription': subscription.to_dict()
    }), 200

@cards_bp.route('/<int:card_id>/subscriptions/<int:sub_id>/resume', methods=['POST'])
@jwt_required()
def resume_subscription(card_id, sub_id):
    """Resume a paused subscription"""
    user_id = int(get_jwt_identity())
    card = VirtualCard.query.filter_by(id=card_id, user_id=user_id).first()
    
    if not card:
        return jsonify({'error': 'Card not found'}), 404
    
    subscription = Subscription.query.filter_by(id=sub_id, card_id=card_id).first()
    if not subscription:
        return jsonify({'error': 'Subscription not found'}), 404
    
    subscription.is_active = True
    
    if subscription.next_billing_date:
        next_billing_datetime = datetime.combine(subscription.next_billing_date, datetime.min.time())
        
        scheduled_transaction = Transaction(
            user_id=user_id,
            transaction_type='subscription_payment',
            transaction_source='budget_card',
            amount=float(subscription.amount),
            status='scheduled',
            description=f'{subscription.service_name} - {subscription.billing_cycle} subscription',
            transaction_metadata={
                'source': 'SUBSCRIPTION_PAYMENT',
                'subscription_id': subscription.id,
                'card_id': card_id,
                'billing_cycle': subscription.billing_cycle,
                'scheduled': True,
                'upcoming': True,
                'category': subscription.service_category or 'subscription',
                'display_color': '#FACC15'
            },
            created_at=next_billing_datetime
        )
        
        db.session.add(scheduled_transaction)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Subscription resumed successfully',
        'subscription': subscription.to_dict()
    }), 200

@cards_bp.route('/subscriptions/sync-upcoming', methods=['POST'])
@jwt_required()
def sync_upcoming_payments():
    """
    Sync and generate upcoming subscription payments for all active subscriptions.
    Ensures each active subscription has its next payment scheduled (one month ahead only).
    """
    try:
        result = SubscriptionSchedulerService.sync_all_active()
        
        return jsonify({
            'message': 'Upcoming payments synced successfully',
            'stats': result
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@cards_bp.route('/subscriptions/<int:sub_id>/process-payment', methods=['POST'])
@jwt_required()
def process_subscription_payment(sub_id):
    """
    Process a scheduled subscription payment.
    Deducts from budget card, marks transaction as completed, and schedules next payment.
    """
    user_id = int(get_jwt_identity())
    
    try:
        subscription = Subscription.query.get(sub_id)
        if not subscription:
            return jsonify({'error': 'Subscription not found'}), 404
        
        if subscription.card.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        if not subscription.is_active:
            return jsonify({'error': 'Subscription is not active'}), 400
        
        card = subscription.card
        
        if card.get_remaining_balance() < subscription.amount:
            return jsonify({'error': 'Insufficient card balance'}), 400
        
        scheduled_transaction = Transaction.query.filter(
            Transaction.transaction_metadata['subscription_id'].astext == str(sub_id),
            Transaction.status == 'scheduled'
        ).order_by(Transaction.created_at.asc()).first()
        
        card.spent_amount = (card.spent_amount or VirtualCard.to_decimal(0)) + VirtualCard.to_decimal(subscription.amount)
        card.updated_at = datetime.utcnow()
        
        if scheduled_transaction:
            scheduled_transaction.status = 'completed'
            scheduled_transaction.completed_at = datetime.utcnow()
        else:
            scheduled_transaction = Transaction(
                user_id=user_id,
                transaction_type='subscription_payment',
                transaction_source='budget_card',
                amount=float(subscription.amount),
                status='completed',
                description=f'{subscription.service_name} - {subscription.billing_cycle} subscription',
                transaction_metadata={
                    'source': 'SUBSCRIPTION_PAYMENT',
                    'subscription_id': subscription.id,
                    'card_id': subscription.card_id,
                    'billing_cycle': subscription.billing_cycle,
                    'category': subscription.service_category or 'subscription',
                    'service_name': subscription.service_name
                },
                completed_at=datetime.utcnow(),
                card_id=subscription.card_id
            )
            db.session.add(scheduled_transaction)
        
        next_transaction = SubscriptionSchedulerService.process_payment_completion(scheduled_transaction)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Subscription payment processed successfully',
            'subscription': subscription.to_dict(),
            'transaction': scheduled_transaction.to_dict(),
            'next_payment_scheduled': next_transaction is not None,
            'card_balance': float(card.get_remaining_balance())
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

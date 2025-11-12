"""
Subscriptions Blueprint

Purpose:
    API endpoints for managing subscription-based virtual cards.
    Handles subscription CRUD operations, catalog browsing, and statistics.

Expected Functions:
    - GET /catalog - List predefined subscription services
    - GET / - Get user's subscriptions
    - POST / - Create new subscription
    - PUT /<id> - Update subscription status
    - DELETE /<id> - Cancel subscription
    - POST /<id>/process-payment - Simulate monthly billing
    - GET /statistics - Get subscription spending stats

Current Implementation Status:
    [DONE] Blueprint creation and registration
    [DONE] Predefined subscription catalog
    [DONE] Create subscription endpoint
    [DONE] List user subscriptions
    [DONE] Update subscription status (pause/resume)
    [DONE] Cancel subscription
    [DONE] Simulated monthly billing
    [DONE] Statistics endpoint
    [DONE] JWT authentication on all routes
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from app.extensions import db
from app.models.subscription_card import SubscriptionCard
from app.models.wallet import Wallet
from app.models.transaction import Transaction

subscriptions_bp = Blueprint('subscriptions', __name__)

# Predefined Subscription Catalog
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
    {
        'id': 'hbo-max',
        'service_name': 'HBO Max',
        'category': 'streaming',
        'monthly_cost': 15.99,
        'description': 'Stream HBO originals and blockbuster movies',
        'icon_url': 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/hbo.svg',
        'color': '#7B5AB0'
    },
    {
        'id': 'amazon-prime',
        'service_name': 'Amazon Prime',
        'category': 'shopping',
        'monthly_cost': 14.99,
        'description': 'Free shipping, Prime Video, and exclusive deals',
        'icon_url': 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/amazon.svg',
        'color': '#FF9900'
    },
    {
        'id': 'google-one',
        'service_name': 'Google One (100GB)',
        'category': 'cloud',
        'monthly_cost': 1.99,
        'description': 'Cloud storage and member benefits',
        'icon_url': 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/google.svg',
        'color': '#4285F4'
    },
    {
        'id': 'icloud-plus',
        'service_name': 'iCloud+ (50GB)',
        'category': 'cloud',
        'monthly_cost': 0.99,
        'description': 'iCloud storage with privacy features',
        'icon_url': 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/icloud.svg',
        'color': '#3693F3'
    },
    {
        'id': 'dropbox-plus',
        'service_name': 'Dropbox Plus',
        'category': 'cloud',
        'monthly_cost': 11.99,
        'description': '2TB of secure cloud storage',
        'icon_url': 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/dropbox.svg',
        'color': '#0061FF'
    },
    {
        'id': 'github-pro',
        'service_name': 'GitHub Pro',
        'category': 'development',
        'monthly_cost': 4.00,
        'description': 'Advanced tools for developers',
        'icon_url': 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/github.svg',
        'color': '#181717'
    },
    {
        'id': 'notion-plus',
        'service_name': 'Notion Plus',
        'category': 'productivity',
        'monthly_cost': 8.00,
        'description': 'All-in-one workspace for notes and projects',
        'icon_url': 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/notion.svg',
        'color': '#000000'
    },
    {
        'id': 'linkedin-premium',
        'service_name': 'LinkedIn Premium',
        'category': 'professional',
        'monthly_cost': 29.99,
        'description': 'Career insights and networking tools',
        'icon_url': 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/linkedin.svg',
        'color': '#0A66C2'
    },
    {
        'id': 'coursera-plus',
        'service_name': 'Coursera Plus',
        'category': 'education',
        'monthly_cost': 59.00,
        'description': 'Unlimited access to 7,000+ courses',
        'icon_url': 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/coursera.svg',
        'color': '#0056D2'
    },
    {
        'id': 'grammarly-premium',
        'service_name': 'Grammarly Premium',
        'category': 'productivity',
        'monthly_cost': 12.00,
        'description': 'Advanced writing assistance',
        'icon_url': 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/grammarly.svg',
        'color': '#15C39A'
    }
]

@subscriptions_bp.route('/catalog', methods=['GET'])
@jwt_required()
def get_catalog():
    """
    Get predefined subscription catalog.
    
    Returns:
        JSON: List of available subscription services
        
    Status: [DONE]
    """
    # Optional: Filter by category
    category = request.args.get('category')
    
    if category:
        filtered = [s for s in SUBSCRIPTION_CATALOG if s['category'] == category]
        return jsonify({'catalog': filtered})
    
    return jsonify({'catalog': SUBSCRIPTION_CATALOG})

@subscriptions_bp.route('/', methods=['GET'])
@jwt_required()
def get_subscriptions():
    """
    Get all subscriptions for the current user.
    
    Query Params:
        status (optional): Filter by status (active, paused, pending)
        
    Returns:
        JSON: List of user's subscriptions
        
    Status: [DONE]
    """
    current_user_id = int(get_jwt_identity())
    status_filter = request.args.get('status')
    
    query = SubscriptionCard.query.filter_by(user_id=current_user_id)
    
    if status_filter:
        query = query.filter_by(status=status_filter)
    
    subscriptions = query.order_by(SubscriptionCard.created_at.desc()).all()
    
    return jsonify({
        'subscriptions': [sub.to_dict() for sub in subscriptions]
    })

@subscriptions_bp.route('/', methods=['POST'])
@jwt_required()
def create_subscription():
    """
    Create a new subscription (from catalog or custom).
    
    Request Body:
        service_name (str): Name of the service
        category (str): Service category
        monthly_cost (float): Monthly subscription cost
        next_billing_date (str): ISO format date for next billing
        is_custom (bool): Whether this is a custom subscription
        icon_url (str, optional): URL to service icon
        description (str, optional): Service description
        
    Returns:
        JSON: Created subscription details
        
    Status: [DONE]
    """
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    
    try:
        # Parse next_billing_date - accept both ISO format and simple date
        billing_date_str = data['next_billing_date']
        if 'T' in billing_date_str:
            # ISO format with time
            next_billing_date = datetime.fromisoformat(billing_date_str.replace('Z', '+00:00')).date()
        else:
            # Simple YYYY-MM-DD format
            next_billing_date = datetime.strptime(billing_date_str, '%Y-%m-%d').date()
        
        # Create new subscription
        subscription = SubscriptionCard(
            user_id=current_user_id,
            service_name=data['service_name'],
            category=data['category'],
            monthly_cost=data['monthly_cost'],
            next_billing_date=next_billing_date,
            status='active',
            is_custom=data.get('is_custom', False),
            icon_url=data.get('icon_url'),
            description=data.get('description')
        )
        
        db.session.add(subscription)
        db.session.commit()
        
        return jsonify({
            'message': 'Subscription created successfully',
            'subscription': subscription.to_dict()
        }), 201
        
    except KeyError as e:
        return jsonify({'error': f'Missing required field: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@subscriptions_bp.route('/<int:subscription_id>', methods=['PUT'])
@jwt_required()
def update_subscription(subscription_id):
    """
    Update subscription status (pause, resume, etc.).
    
    Path Params:
        subscription_id: ID of the subscription to update
        
    Request Body:
        status (str): New status (active, paused, pending)
        
    Returns:
        JSON: Updated subscription details
        
    Status: [DONE]
    """
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    
    subscription = SubscriptionCard.query.filter_by(
        id=subscription_id,
        user_id=current_user_id
    ).first()
    
    if not subscription:
        return jsonify({'error': 'Subscription not found'}), 404
    
    # Update status
    if 'status' in data:
        if data['status'] not in ['active', 'paused', 'pending']:
            return jsonify({'error': 'Invalid status. Must be active, paused, or pending'}), 400
        subscription.status = data['status']
    
    subscription.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'message': 'Subscription updated successfully',
        'subscription': subscription.to_dict()
    })

@subscriptions_bp.route('/<int:subscription_id>', methods=['DELETE'])
@jwt_required()
def cancel_subscription(subscription_id):
    """
    Cancel a subscription.
    
    Path Params:
        subscription_id: ID of the subscription to cancel
        
    Returns:
        JSON: Success message
        
    Status: [DONE]
    """
    current_user_id = int(get_jwt_identity())
    
    subscription = SubscriptionCard.query.filter_by(
        id=subscription_id,
        user_id=current_user_id
    ).first()
    
    if not subscription:
        return jsonify({'error': 'Subscription not found'}), 404
    
    db.session.delete(subscription)
    db.session.commit()
    
    return jsonify({'message': 'Subscription cancelled successfully'})

@subscriptions_bp.route('/<int:subscription_id>/process-payment', methods=['POST'])
@jwt_required()
def process_monthly_payment(subscription_id):
    """
    Simulate monthly subscription billing.
    
    Path Params:
        subscription_id: ID of the subscription to bill
        
    Returns:
        JSON: Payment result
        
    Status: [DONE] (Simulated)
    """
    current_user_id = int(get_jwt_identity())
    
    subscription = SubscriptionCard.query.filter_by(
        id=subscription_id,
        user_id=current_user_id
    ).first()
    
    if not subscription:
        return jsonify({'error': 'Subscription not found'}), 404
    
    if subscription.status != 'active':
        return jsonify({'error': 'Subscription is not active'}), 400
    
    # Get user's wallet
    wallet = Wallet.query.filter_by(user_id=current_user_id).first()
    
    # Check sufficient balance
    if wallet.balance < subscription.monthly_cost:
        return jsonify({'error': 'Insufficient balance'}), 400
    
    # Deduct payment
    wallet.balance -= subscription.monthly_cost
    
    # Update subscription
    subscription.total_paid += subscription.monthly_cost
    subscription.last_billing_date = datetime.utcnow().date()
    subscription.next_billing_date = (datetime.utcnow() + timedelta(days=30)).date()
    
    # Create transaction record
    transaction = Transaction(
        user_id=current_user_id,
        transaction_type='subscription_payment',
        transaction_source='main_wallet',
        amount=subscription.monthly_cost,
        description=f'Monthly payment for {subscription.service_name}',
        status='completed'
    )
    
    db.session.add(transaction)
    db.session.commit()
    
    return jsonify({
        'message': 'Payment processed successfully',
        'subscription': subscription.to_dict(),
        'new_balance': float(wallet.balance)
    })

@subscriptions_bp.route('/statistics', methods=['GET'])
@jwt_required()
def get_statistics():
    """
    Get subscription statistics for the user.
    
    Returns:
        JSON: Subscription spending statistics
        
    Status: [DONE]
    """
    current_user_id = int(get_jwt_identity())
    
    subscriptions = SubscriptionCard.query.filter_by(user_id=current_user_id).all()
    
    active_subscriptions = [s for s in subscriptions if s.status == 'active']
    paused_subscriptions = [s for s in subscriptions if s.status == 'paused']
    
    total_monthly_cost = sum(s.monthly_cost for s in active_subscriptions)
    total_paid = sum(s.total_paid for s in subscriptions)
    
    # Find next billing subscription
    next_billing = None
    if active_subscriptions:
        next_sub = min(active_subscriptions, key=lambda s: s.next_billing_date)
        next_billing = {
            'service_name': next_sub.service_name,
            'amount': float(next_sub.monthly_cost),
            'date': next_sub.next_billing_date.isoformat()
        }
    
    # Category breakdown
    category_spending = {}
    for sub in active_subscriptions:
        if sub.category not in category_spending:
            category_spending[sub.category] = 0
        category_spending[sub.category] += float(sub.monthly_cost)
    
    return jsonify({
        'total_subscriptions': len(subscriptions),
        'active_subscriptions': len(active_subscriptions),
        'paused_subscriptions': len(paused_subscriptions),
        'total_monthly_cost': float(total_monthly_cost),
        'total_paid': float(total_paid),
        'next_billing': next_billing,
        'category_spending': category_spending
    })

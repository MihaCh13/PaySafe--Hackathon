"""
Payments Blueprint - Stripe Integration
Handles wallet top-up via Stripe checkout sessions and webhooks.
"""
import stripe
import os
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db, limiter
from app.models import Wallet, Transaction
from app.utils.validators import validate_amount
from datetime import datetime
from decimal import Decimal

payments_bp = Blueprint('payments', __name__)

stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')


@payments_bp.route('/create-checkout-session', methods=['POST'])
@jwt_required()
@limiter.limit("10 per hour")
def create_checkout_session():
    """
    Create Stripe checkout session for wallet top-up.
    
    Returns redirect URL to Stripe hosted checkout page.
    """
    user_id = int(get_jwt_identity())
    data = request.json
    
    if not data or 'amount' not in data:
        return jsonify({'error': 'Amount is required'}), 400
    
    try:
        amount = float(data['amount'])
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid amount format'}), 400
    
    valid, error_msg = validate_amount(amount)
    if not valid:
        return jsonify({'error': error_msg}), 400
    
    if amount < 5:
        return jsonify({'error': 'Minimum top-up is $5'}), 400
    if amount > 10000:
        return jsonify({'error': 'Maximum top-up is $10,000'}), 400
    
    if not stripe.api_key:
        return jsonify({'error': 'Payment system not configured. Please contact support.'}), 503
    
    try:
        YOUR_DOMAIN = os.environ.get('REPLIT_DEV_DOMAIN', 'localhost:5000')
        if os.environ.get('REPLIT_DEPLOYMENT') != '1':
            domains = os.environ.get('REPLIT_DOMAINS', '').split(',')
            if domains and domains[0]:
                YOUR_DOMAIN = domains[0]
        
        checkout_session = stripe.checkout.Session.create(
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': 'UniPay Wallet Top-Up',
                        'description': f'Add ${amount:.2f} to your UniPay wallet',
                    },
                    'unit_amount': int(amount * 100),
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f'https://{YOUR_DOMAIN}/topup/success?session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=f'https://{YOUR_DOMAIN}/topup/cancel',
            metadata={
                'user_id': str(user_id),
                'amount': str(amount),
                'app': 'unipay'
            },
            client_reference_id=str(user_id)
        )
        
        current_app.logger.info(f"Stripe checkout session created: User {user_id}, Amount ${amount}")
        
        return jsonify({
            'checkout_url': checkout_session.url,
            'session_id': checkout_session.id
        }), 200
        
    except stripe.error.StripeError as e:
        current_app.logger.error(f"Stripe error: {str(e)}")
        return jsonify({'error': 'Payment session creation failed. Please try again.'}), 500
    except Exception as e:
        current_app.logger.error(f"Checkout session creation failed: {str(e)}")
        return jsonify({'error': 'Payment session creation failed'}), 500


@payments_bp.route('/webhook', methods=['POST'])
def stripe_webhook():
    """
    Handle Stripe webhook events.
    
    Processes payment confirmations and updates wallet balances.
    """
    payload = request.get_data()
    sig_header = request.headers.get('Stripe-Signature')
    
    webhook_secret = os.environ.get('STRIPE_WEBHOOK_SECRET')
    
    if not webhook_secret:
        current_app.logger.warning("Webhook received but STRIPE_WEBHOOK_SECRET not configured")
        return jsonify({'error': 'Webhook not configured'}), 500
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
        
        current_app.logger.info(f"Stripe webhook received: {event['type']}")
        
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            
            user_id = int(session['metadata']['user_id'])
            amount = Decimal(str(session['metadata']['amount']))
            
            wallet = Wallet.query.filter_by(user_id=user_id).with_for_update().first()
            
            if not wallet:
                current_app.logger.error(f"Wallet not found for user {user_id}")
                return jsonify({'error': 'Wallet not found'}), 404
            
            wallet.balance += amount
            
            transaction = Transaction(
                user_id=user_id,
                transaction_type='topup',
                transaction_source='stripe',
                amount=float(amount),
                status='completed',
                description='Stripe payment top-up',
                transaction_metadata={
                    'stripe_session_id': session['id'],
                    'payment_intent': session.get('payment_intent'),
                    'payment_status': session.get('payment_status')
                },
                completed_at=datetime.utcnow()
            )
            db.session.add(transaction)
            db.session.commit()
            
            current_app.logger.info(f"Wallet topped up successfully: User {user_id}, Amount ${amount}, New Balance ${wallet.balance}")
            
            return jsonify({'status': 'success', 'message': 'Wallet updated'}), 200
        
        return jsonify({'status': 'ignored', 'message': f'Unhandled event type: {event["type"]}'}), 200
        
    except ValueError as e:
        current_app.logger.error(f"Invalid webhook payload: {str(e)}")
        return jsonify({'error': 'Invalid payload'}), 400
    except stripe.error.SignatureVerificationError as e:
        current_app.logger.error(f"Invalid webhook signature: {str(e)}")
        return jsonify({'error': 'Invalid signature'}), 400
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Webhook processing failed: {str(e)}")
        return jsonify({'error': 'Webhook processing failed'}), 500


@payments_bp.route('/verify/<session_id>', methods=['GET'])
@jwt_required()
def verify_payment(session_id):
    """
    Verify payment status by session ID.
    
    Allows frontend to check if payment was successful.
    """
    user_id = int(get_jwt_identity())
    
    if not stripe.api_key:
        return jsonify({'error': 'Payment system not configured'}), 503
    
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        
        if int(session.get('client_reference_id', 0)) != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        return jsonify({
            'status': session.status,
            'payment_status': session.payment_status,
            'amount': session.amount_total / 100,
            'customer_email': session.customer_email
        }), 200
        
    except stripe.error.StripeError as e:
        current_app.logger.error(f"Payment verification failed: {str(e)}")
        return jsonify({'error': 'Verification failed'}), 500
    except Exception as e:
        current_app.logger.error(f"Verification error: {str(e)}")
        return jsonify({'error': 'Verification failed'}), 500

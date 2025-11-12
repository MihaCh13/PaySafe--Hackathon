from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import User, Wallet, Transaction
from app.utils.validators import TransferSchema, TopUpSchema, sanitize_html
from marshmallow import ValidationError
from datetime import datetime, timedelta
from decimal import Decimal, InvalidOperation
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
import secrets

wallet_bp = Blueprint('wallet', __name__)


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


@wallet_bp.route('', methods=['GET'])
@wallet_bp.route('/', methods=['GET'])
@jwt_required()
def get_wallet():
    user_id = int(get_jwt_identity())
    wallet = Wallet.query.filter_by(user_id=user_id).first()
    
    if not wallet:
        return jsonify({'error': 'Wallet not found'}), 404
    
    return jsonify({'wallet': wallet.to_dict()}), 200

@wallet_bp.route('/topup', methods=['POST'])
@jwt_required()
def topup_wallet():
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        # Validate input using Marshmallow schema
        try:
            schema = TopUpSchema()
            validated_data = schema.load(data)
        except ValidationError as e:
            current_app.logger.warning(f"Top-up validation failed for user {user_id}: {e.messages}")
            return jsonify({'error': 'Validation failed', 'details': e.messages}), 400
        
        amount = validated_data['amount']
        method = validated_data['method']
        
        amount_decimal = Decimal(str(amount))
        
        wallet = Wallet.query.filter_by(user_id=user_id).with_for_update().first()
        
        if not wallet:
            return jsonify({'error': 'Wallet not found'}), 404
        
        wallet.balance += amount_decimal
        
        transaction = Transaction(
            user_id=user_id,
            transaction_type='topup',
            transaction_source='main_wallet',
            amount=amount_decimal,
            status='completed',
            receiver_id=user_id,
            description=f'Top-up via {method}',
            completed_at=datetime.utcnow(),
            transaction_metadata={'method': method}
        )
        
        db.session.add(wallet)
        db.session.add(transaction)
        db.session.commit()
        db.session.refresh(wallet)
        
        return jsonify({
            'message': 'Wallet topped up successfully',
            'wallet': wallet.to_dict(),
            'transaction': transaction.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f"Top-up error: {str(e)}")
        return jsonify({'error': f'Top-up failed: {str(e)}'}), 500

@wallet_bp.route('/transfer', methods=['POST'])
@jwt_required()
def transfer_money():
    sender_id = int(get_jwt_identity())
    data = request.get_json()
    
    # Validate input using Marshmallow schema
    try:
        # Map receiver_username to recipient for schema validation
        validation_data = {
            'recipient': data.get('receiver_username'),
            'amount': data.get('amount'),
            'description': data.get('description', '')
        }
        schema = TransferSchema()
        validated_data = schema.load(validation_data)
    except ValidationError as e:
        current_app.logger.warning(f"Transfer validation failed for user {sender_id}: {e.messages}")
        return jsonify({'error': 'Validation failed', 'details': e.messages}), 400
    
    receiver_username = sanitize_html(validated_data['recipient'])
    amount = Decimal(str(validated_data['amount']))
    description = sanitize_html(validated_data.get('description', '')) if validated_data.get('description') else ''
    
    receiver = User.query.filter_by(username=receiver_username).first()
    if not receiver:
        return jsonify({'error': 'Receiver not found'}), 404
    
    if receiver.id == sender_id:
        return jsonify({'error': 'Cannot transfer to yourself'}), 400
    
    try:
        # Lock both wallets in deterministic order to prevent deadlocks
        sender_wallet, receiver_wallet = lock_wallets_deterministic(sender_id, receiver.id)
        
        if not sender_wallet:
            return jsonify({'error': 'Sender wallet not found'}), 404
        
        if not receiver_wallet:
            return jsonify({'error': 'Receiver wallet not found'}), 404
        
        if sender_wallet.balance < amount:
            return jsonify({'error': 'Insufficient balance'}), 400
        
        sender_wallet.balance -= amount
        receiver_wallet.balance += amount
        
        sender_transaction = Transaction(
            user_id=sender_id,
            transaction_type='transfer_sent',
            transaction_source='main_wallet',
            amount=amount,
            status='completed',
            sender_id=sender_id,
            receiver_id=receiver.id,
            description=description or f'Transfer to {receiver.username}',
            completed_at=datetime.utcnow()
        )
        
        receiver_transaction = Transaction(
            user_id=receiver.id,
            transaction_type='transfer_received',
            transaction_source='main_wallet',
            amount=amount,
            status='completed',
            sender_id=sender_id,
            receiver_id=receiver.id,
            description=description or f'Transfer from {sender_wallet.user.username}',
            completed_at=datetime.utcnow()
        )
        
        db.session.add(sender_transaction)
        db.session.add(receiver_transaction)
        db.session.commit()
        
        return jsonify({
            'message': 'Transfer successful',
            'wallet': sender_wallet.to_dict(),
            'transaction': sender_transaction.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Transfer error: {str(e)}")
        return jsonify({'error': f'Transfer failed: {str(e)}'}), 500

@wallet_bp.route('/qr-payment-token', methods=['GET'])
@jwt_required()
def generate_qr_payment_token():
    """
    Generate a signed, short-lived token for QR code payments.
    Uses itsdangerous URLSafeTimedSerializer (NOT JWT) to prevent token reuse for API authentication.
    The token can ONLY be used for QR payment verification, not for general API access.
    Expires after 5 minutes.
    """
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Create a separate serializer for QR payment tokens (NOT reusable for auth)
    serializer = URLSafeTimedSerializer(
        current_app.config['SECRET_KEY'],
        salt='qr-payment-token'  # Separate salt prevents cross-use
    )
    
    # Token data - only what's needed for payment verification
    token_data = {
        'user_id': user_id,
        'username': user.username,
        'purpose': 'qr_payment_only'  # Cannot be used as bearer token
    }
    
    # Generate signed token (5-minute validity)
    qr_token = serializer.dumps(token_data)
    
    return jsonify({
        'token': qr_token,
        'username': user.username,
        'user_id': user_id,
        'expires_in': 300  # 5 minutes in seconds
    }), 200

@wallet_bp.route('/verify-qr-token', methods=['POST'])
@jwt_required()
def verify_qr_payment_token():
    """
    Verify a scanned QR payment token and return the recipient's information.
    Validates signed token using itsdangerous (NOT JWT), so tokens cannot be used for API auth.
    
    Request body:
    {
        "token": "scanned_signed_token"
    }
    
    Returns:
    {
        "valid": true,
        "recipient": {
            "user_id": 123,
            "username": "student"
        }
    }
    """
    data = request.get_json()
    qr_token = data.get('token')
    
    if not qr_token:
        return jsonify({'error': 'Token is required'}), 400
    
    try:
        # Create serializer with same salt as generation
        serializer = URLSafeTimedSerializer(
            current_app.config['SECRET_KEY'],
            salt='qr-payment-token'
        )
        
        # Verify token signature and expiry (300 seconds = 5 minutes)
        token_data = serializer.loads(qr_token, max_age=300)
        
        # Verify this is a QR payment token
        if token_data.get('purpose') != 'qr_payment_only':
            return jsonify({'error': 'Invalid token purpose'}), 400
        
        recipient_id = token_data.get('user_id')
        recipient_username = token_data.get('username')
        
        # Verify the user still exists and is active
        recipient = User.query.get(recipient_id)
        if not recipient or not recipient.is_active:
            return jsonify({'error': 'Recipient not found or inactive'}), 404
        
        # Prevent self-transfers
        scanner_id = int(get_jwt_identity())
        if scanner_id == recipient_id:
            return jsonify({'error': 'Cannot send money to yourself'}), 400
        
        return jsonify({
            'valid': True,
            'recipient': {
                'user_id': recipient_id,
                'username': recipient_username,
                'full_name': f"{recipient.first_name} {recipient.last_name}" if recipient.first_name else recipient_username
            }
        }), 200
        
    except SignatureExpired:
        return jsonify({'error': 'QR code has expired. Please generate a new one.'}), 401
    except BadSignature:
        return jsonify({'error': 'Invalid QR code signature'}), 401
    except Exception as e:
        print(f"QR verification error: {str(e)}")
        return jsonify({'error': 'Failed to verify QR code'}), 500

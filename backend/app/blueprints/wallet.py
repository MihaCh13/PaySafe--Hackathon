from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import User, Wallet, Transaction
from datetime import datetime
from decimal import Decimal, InvalidOperation

wallet_bp = Blueprint('wallet', __name__)

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
        amount = data.get('amount')
        method = data.get('method', 'bank_transfer')
        
        if not amount or float(amount) <= 0:
            return jsonify({'error': 'Invalid amount'}), 400
        
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
    receiver_username = data.get('receiver_username')
    amount = data.get('amount')
    description = data.get('description', '')
    
    if not receiver_username or not amount:
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        amount = Decimal(str(amount))
    except (ValueError, TypeError, InvalidOperation):
        return jsonify({'error': 'Invalid amount format'}), 400
    
    if amount <= 0:
        return jsonify({'error': 'Invalid amount'}), 400
    
    receiver = User.query.filter_by(username=receiver_username).first()
    if not receiver:
        return jsonify({'error': 'Receiver not found'}), 404
    
    if receiver.id == sender_id:
        return jsonify({'error': 'Cannot transfer to yourself'}), 400
    
    try:
        sender_wallet = Wallet.query.filter_by(user_id=sender_id).with_for_update().first()
        
        if not sender_wallet:
            return jsonify({'error': 'Sender wallet not found'}), 404
        
        receiver_wallet = Wallet.query.filter_by(user_id=receiver.id).with_for_update().first()
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

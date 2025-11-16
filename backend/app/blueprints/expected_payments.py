from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Transaction
from app.extensions import db
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta

expected_payments_bp = Blueprint('expected_payments', __name__)

@expected_payments_bp.route('', methods=['GET'])
@expected_payments_bp.route('/', methods=['GET'])
@jwt_required()
def get_expected_payments():
    """Get all expected/scheduled payments for the current user"""
    user_id = int(get_jwt_identity())
    
    # Get all scheduled transactions (expected payments)
    scheduled_transactions = Transaction.query.filter_by(
        user_id=user_id,
        status='scheduled'
    ).order_by(Transaction.created_at.desc()).all()
    
    return jsonify({
        'expected_payments': [t.to_dict() for t in scheduled_transactions],
        'count': len(scheduled_transactions)
    }), 200

@expected_payments_bp.route('', methods=['POST'])
@expected_payments_bp.route('/', methods=['POST'])
@jwt_required()
def create_expected_payment():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    title = data.get('title')
    amount = data.get('amount')
    date = data.get('date')
    category = data.get('category', 'other')
    frequency = data.get('frequency', 'one-time')
    notes = data.get('notes', '')
    
    if not title or not amount or not date:
        return jsonify({'error': 'Title, amount, and date are required'}), 400
    
    try:
        amount = float(amount)
        if amount <= 0:
            return jsonify({'error': 'Amount must be positive'}), 400
    except ValueError:
        return jsonify({'error': 'Invalid amount'}), 400
    
    try:
        payment_date = datetime.fromisoformat(date.replace('Z', '+00:00'))
    except ValueError:
        return jsonify({'error': 'Invalid date format'}), 400
    
    metadata = {
        'source': 'USER_EXPECTED_PAYMENT',
        'category': category,
        'scheduled': True,
        'upcoming': True,
        'frequency': frequency,
        'notes': notes,
        'user_created': True
    }
    
    transaction = Transaction(
        user_id=user_id,
        transaction_type='payment',
        transaction_source='main_wallet',
        amount=amount,
        status='scheduled',
        description=title,
        transaction_metadata=metadata,
        created_at=payment_date
    )
    
    db.session.add(transaction)
    db.session.commit()
    
    return jsonify({
        'message': 'Expected payment created successfully',
        'payment': transaction.to_dict()
    }), 201

@expected_payments_bp.route('/<int:payment_id>', methods=['PUT'])
@jwt_required()
def update_expected_payment(payment_id):
    user_id = int(get_jwt_identity())
    
    transaction = Transaction.query.filter_by(
        id=payment_id,
        user_id=user_id,
        status='scheduled'
    ).first()
    
    if not transaction:
        return jsonify({'error': 'Expected payment not found'}), 404
    
    data = request.get_json()
    
    if 'title' in data:
        transaction.description = data['title']
    
    if 'amount' in data:
        try:
            amount = float(data['amount'])
            if amount <= 0:
                return jsonify({'error': 'Amount must be positive'}), 400
            transaction.amount = amount
        except ValueError:
            return jsonify({'error': 'Invalid amount'}), 400
    
    if 'date' in data:
        try:
            payment_date = datetime.fromisoformat(data['date'].replace('Z', '+00:00'))
            transaction.created_at = payment_date
        except ValueError:
            return jsonify({'error': 'Invalid date format'}), 400
    
    metadata = transaction.transaction_metadata or {}
    
    if 'category' in data:
        metadata['category'] = data['category']
    
    if 'frequency' in data:
        metadata['frequency'] = data['frequency']
    
    if 'notes' in data:
        metadata['notes'] = data['notes']
    
    transaction.transaction_metadata = metadata
    
    db.session.commit()
    
    return jsonify({
        'message': 'Expected payment updated successfully',
        'payment': transaction.to_dict()
    }), 200

@expected_payments_bp.route('/<int:payment_id>', methods=['DELETE'])
@jwt_required()
def delete_expected_payment(payment_id):
    user_id = int(get_jwt_identity())
    
    transaction = Transaction.query.filter_by(
        id=payment_id,
        user_id=user_id,
        status='scheduled'
    ).first()
    
    if not transaction:
        return jsonify({'error': 'Expected payment not found'}), 404
    
    db.session.delete(transaction)
    db.session.commit()
    
    return jsonify({'message': 'Expected payment deleted successfully'}), 200

@expected_payments_bp.route('/generate-recurring', methods=['POST'])
@jwt_required()
def generate_recurring_payments():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    base_payment_id = data.get('payment_id')
    months_ahead = data.get('months', 3)
    
    base_payment = Transaction.query.filter_by(
        id=base_payment_id,
        user_id=user_id,
        status='scheduled'
    ).first()
    
    if not base_payment:
        return jsonify({'error': 'Base payment not found'}), 404
    
    metadata = base_payment.transaction_metadata or {}
    frequency = metadata.get('frequency', 'one-time')
    
    if frequency == 'one-time':
        return jsonify({'message': 'Payment is one-time, no recurring instances needed'}), 200
    
    created_payments = []
    current_date = base_payment.created_at
    end_date = current_date + relativedelta(months=months_ahead)
    
    if frequency == 'monthly':
        for i in range(1, months_ahead + 1):
            next_date = current_date + relativedelta(months=i)
            
            existing = Transaction.query.filter_by(
                user_id=user_id,
                description=base_payment.description,
                created_at=next_date,
                status='scheduled'
            ).first()
            
            if existing:
                continue
            
            new_payment = Transaction(
                user_id=user_id,
                transaction_type=base_payment.transaction_type,
                transaction_source=base_payment.transaction_source or 'main_wallet',
                amount=base_payment.amount,
                status='scheduled',
                description=base_payment.description,
                transaction_metadata=metadata.copy(),
                created_at=next_date
            )
            
            db.session.add(new_payment)
            created_payments.append(new_payment.to_dict())
    
    elif frequency == 'weekly':
        week_count = 0
        next_date = current_date + timedelta(weeks=1)
        
        while next_date <= end_date:
            existing = Transaction.query.filter_by(
                user_id=user_id,
                description=base_payment.description,
                created_at=next_date,
                status='scheduled'
            ).first()
            
            if not existing:
                new_payment = Transaction(
                    user_id=user_id,
                    transaction_type=base_payment.transaction_type,
                    transaction_source=base_payment.transaction_source or 'main_wallet',
                    amount=base_payment.amount,
                    status='scheduled',
                    description=base_payment.description,
                    transaction_metadata=metadata.copy(),
                    created_at=next_date
                )
                
                db.session.add(new_payment)
                created_payments.append(new_payment.to_dict())
            
            week_count += 1
            next_date = current_date + timedelta(weeks=week_count + 1)
    
    db.session.commit()
    
    return jsonify({
        'message': f'Generated {len(created_payments)} recurring payments',
        'payments': created_payments
    }), 201

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import SavingsPocket, Goal, User, Wallet, Transaction
from decimal import Decimal
from datetime import datetime

savings_bp = Blueprint('savings', __name__)

@savings_bp.route('/pockets', methods=['GET'])
@jwt_required()
def get_savings_pockets():
    user_id = int(get_jwt_identity())
    pockets = SavingsPocket.query.filter_by(user_id=user_id).all()
    
    return jsonify({
        'pockets': [pocket.to_dict() for pocket in pockets]
    }), 200

@savings_bp.route('/pockets', methods=['POST'])
@jwt_required()
def create_savings_pocket():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    pocket = SavingsPocket(
        user_id=user_id,
        name=data.get('name', 'DarkDays Pocket'),
        auto_save_percentage=data.get('auto_save_percentage', 20.00),
        auto_save_frequency=data.get('auto_save_frequency')
    )
    
    db.session.add(pocket)
    db.session.commit()
    
    return jsonify({
        'message': 'Savings pocket created successfully',
        'pocket': pocket.to_dict()
    }), 201

@savings_bp.route('/pockets/<int:pocket_id>/deposit', methods=['POST'])
@jwt_required()
def deposit_to_pocket(pocket_id):
    user_id = int(get_jwt_identity())
    
    data = request.get_json()
    amount = data.get('amount')
    pin = data.get('pin')
    
    if not amount or float(amount) <= 0:
        return jsonify({'error': 'Invalid amount'}), 400
    
    amount_decimal = Decimal(str(amount))
    
    # Lock rows to prevent race conditions
    pocket = SavingsPocket.query.filter_by(id=pocket_id, user_id=user_id).with_for_update().first()
    
    if not pocket:
        return jsonify({'error': 'Savings pocket not found'}), 404
    
    # Lock wallet row
    wallet = Wallet.query.filter_by(user_id=user_id).with_for_update().first()
    if not wallet:
        return jsonify({'error': 'Wallet not found'}), 404
    
    # Check wallet balance AFTER locking
    if wallet.balance < amount_decimal:
        return jsonify({'error': 'Insufficient balance'}), 400
    
    user = User.query.get(user_id)
    if pocket.pin_protected and not user.check_pin(pin):
        return jsonify({'error': 'Invalid PIN'}), 401
    
    # Deduct from wallet
    wallet.balance -= amount_decimal
    
    # Add to savings pocket
    pocket.balance += amount_decimal
    
    # Create transaction record with metadata
    transaction = Transaction(
        user_id=user_id,
        transaction_type='savings_deposit',
        transaction_source='dark_days',
        amount=amount_decimal,
        status='completed',
        description=f'Deposit to {pocket.name}',
        completed_at=datetime.utcnow(),
        transaction_metadata={'pocket_id': pocket.id, 'pocket_name': pocket.name}
    )
    
    db.session.add(transaction)
    db.session.commit()
    
    return jsonify({
        'message': 'Deposit successful',
        'pocket': pocket.to_dict(),
        'wallet': wallet.to_dict(),
        'transaction': transaction.to_dict()
    }), 200

@savings_bp.route('/pockets/<int:pocket_id>/withdraw', methods=['POST'])
@jwt_required()
def withdraw_from_pocket(pocket_id):
    user_id = int(get_jwt_identity())
    
    data = request.get_json()
    amount = data.get('amount')
    pin = data.get('pin')
    emergency_data = data.get('emergencyData')
    
    if not amount or float(amount) <= 0:
        return jsonify({'error': 'Invalid amount'}), 400
    
    amount_decimal = Decimal(str(amount))
    
    # Lock rows to prevent race conditions
    pocket = SavingsPocket.query.filter_by(id=pocket_id, user_id=user_id).with_for_update().first()
    
    if not pocket:
        return jsonify({'error': 'Savings pocket not found'}), 404
    
    # Check savings pocket balance AFTER locking
    if pocket.balance < amount_decimal:
        return jsonify({'error': 'Insufficient balance in savings pocket'}), 400
    
    user = User.query.get(user_id)
    if pocket.pin_protected and not user.check_pin(pin):
        return jsonify({'error': 'Invalid PIN'}), 401
    
    # Lock wallet row
    wallet = Wallet.query.filter_by(user_id=user_id).with_for_update().first()
    if not wallet:
        return jsonify({'error': 'Wallet not found'}), 404
    
    # Deduct from savings pocket
    pocket.balance -= amount_decimal
    
    # Add to wallet
    wallet.balance += amount_decimal
    
    # Create transaction record with metadata (including emergency data if provided)
    transaction_metadata = {
        'pocket_id': pocket.id, 
        'pocket_name': pocket.name
    }
    
    # Add emergency metadata if this is an emergency withdrawal
    if emergency_data:
        transaction_metadata['emergency_category'] = emergency_data.get('category')
        transaction_metadata['emergency_reason'] = emergency_data.get('reason')
        transaction_metadata['is_emergency_withdrawal'] = True
    
    transaction = Transaction(
        user_id=user_id,
        transaction_type='savings_withdrawal',
        transaction_source='dark_days',
        amount=amount_decimal,
        status='completed',
        description=f'{"Emergency withdrawal" if emergency_data else "Withdrawal"} from {pocket.name}',
        completed_at=datetime.utcnow(),
        transaction_metadata=transaction_metadata
    )
    
    db.session.add(transaction)
    db.session.commit()
    
    return jsonify({
        'message': 'Withdrawal successful',
        'pocket': pocket.to_dict(),
        'wallet': wallet.to_dict(),
        'transaction': transaction.to_dict()
    }), 200

@savings_bp.route('/pockets/<int:pocket_id>/auto-save', methods=['PUT'])
@jwt_required()
def update_auto_save_config(pocket_id):
    user_id = int(get_jwt_identity())
    pocket = SavingsPocket.query.filter_by(id=pocket_id, user_id=user_id).first()
    
    if not pocket:
        return jsonify({'error': 'Savings pocket not found'}), 404
    
    data = request.get_json()
    
    pocket.auto_save_enabled = data.get('enabled', pocket.auto_save_enabled)
    pocket.auto_save_percentage = Decimal(str(data.get('percentage', pocket.auto_save_percentage)))
    pocket.auto_save_frequency = data.get('frequency', pocket.auto_save_frequency)
    
    # Handle goal_amount: accept 0 and positive values, validate non-negative
    if 'goal_amount' in data:
        goal_value = data['goal_amount']
        try:
            goal_decimal = Decimal(str(goal_value))
            if goal_decimal < 0:
                return jsonify({'error': 'Goal amount must be non-negative'}), 400
            pocket.goal_amount = goal_decimal
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid goal amount format'}), 400
    
    if data.get('next_date'):
        pocket.next_auto_save_date = datetime.fromisoformat(data['next_date']).date()
    
    db.session.commit()
    
    return jsonify({
        'message': 'Auto-save configuration updated successfully',
        'pocket': pocket.to_dict()
    }), 200

@savings_bp.route('/goals', methods=['GET'])
@jwt_required()
def get_goals():
    user_id = int(get_jwt_identity())
    goals = Goal.query.filter_by(user_id=user_id).all()
    
    return jsonify({
        'goals': [goal.to_dict() for goal in goals]
    }), 200

@savings_bp.route('/goals', methods=['POST'])
@jwt_required()
def create_goal():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    goal = Goal(
        user_id=user_id,
        title=data.get('title'),
        description=data.get('description'),
        target_amount=data.get('target_amount'),
        target_date=datetime.fromisoformat(data['target_date']).date() if data.get('target_date') else None,
        icon=data.get('icon'),
        color=data.get('color')
    )
    
    db.session.add(goal)
    db.session.commit()
    
    return jsonify({
        'message': 'Goal created successfully',
        'goal': goal.to_dict()
    }), 201

@savings_bp.route('/goals/<int:goal_id>/contribute', methods=['POST'])
@jwt_required()
def contribute_to_goal(goal_id):
    user_id = int(get_jwt_identity())
    goal = Goal.query.filter_by(id=goal_id, user_id=user_id).first()
    
    if not goal:
        return jsonify({'error': 'Goal not found'}), 404
    
    data = request.get_json()
    amount = data.get('amount')
    
    if not amount or float(amount) <= 0:
        return jsonify({'error': 'Invalid amount'}), 400
    
    goal.current_amount += Decimal(str(amount))
    
    if goal.current_amount >= goal.target_amount and not goal.is_completed:
        goal.is_completed = True
        goal.completed_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({
        'message': 'Contribution successful',
        'goal': goal.to_dict(),
        'goal_unlocked': goal.is_completed
    }), 200

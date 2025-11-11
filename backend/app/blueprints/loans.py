from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import Loan, LoanRepayment, User, Wallet, Transaction
from app.utils.validators import LoanRequestSchema, sanitize_html
from marshmallow import ValidationError
from datetime import datetime
from decimal import Decimal, InvalidOperation

loans_bp = Blueprint('loans', __name__)

@loans_bp.route('/available-users', methods=['GET'])
@jwt_required()
def get_available_users():
    user_id = int(get_jwt_identity())
    
    # Get all users except current user
    users = User.query.filter(User.id != user_id).all()
    
    return jsonify({
        'users': [{
            'id': user.id,
            'username': user.username,
            'email': user.email
        } for user in users]
    }), 200

@loans_bp.route('', methods=['GET'])
@jwt_required()
def get_loans():
    from sqlalchemy.orm import joinedload
    from sqlalchemy import func
    user_id = int(get_jwt_identity())
    
    # Pending requests I received (I'm the lender, someone is asking to borrow from me)
    pending_requests_received = Loan.query.options(
        joinedload(Loan.borrower)
    ).filter_by(lender_id=user_id, status='pending').all()
    
    # Pending requests I sent (I'm the borrower, I'm asking to borrow)
    pending_requests_sent = Loan.query.options(
        joinedload(Loan.lender)
    ).filter_by(borrower_id=user_id, status='pending').all()
    
    # Active loans where I'm the lender (approved, not fully repaid)
    loans_given = Loan.query.options(
        joinedload(Loan.borrower)
    ).filter(
        Loan.lender_id == user_id,
        Loan.status.in_(['active', 'repaid']),
        Loan.status != 'cancelled'
    ).all()
    
    # Active loans where I'm the borrower (approved, not fully repaid)
    loans_taken = Loan.query.options(
        joinedload(Loan.lender)
    ).filter(
        Loan.borrower_id == user_id,
        Loan.status.in_(['active', 'repaid']),
        Loan.status != 'cancelled'
    ).all()
    
    # Calculate summary statistics (only active loans, exclude pending/cancelled/declined)
    owed_to_me = db.session.query(
        func.sum(Loan.amount - Loan.amount_repaid)
    ).filter(
        Loan.lender_id == user_id,
        Loan.is_fully_repaid == False,
        Loan.status == 'active'
    ).scalar() or 0
    
    i_owe = db.session.query(
        func.sum(Loan.amount - Loan.amount_repaid)
    ).filter(
        Loan.borrower_id == user_id,
        Loan.is_fully_repaid == False,
        Loan.status == 'active'
    ).scalar() or 0
    
    net_balance = float(owed_to_me) - float(i_owe)
    
    return jsonify({
        'pending_requests_received': [loan.to_dict() for loan in pending_requests_received],
        'pending_requests_sent': [loan.to_dict() for loan in pending_requests_sent],
        'loans_given': [loan.to_dict() for loan in loans_given],
        'loans_taken': [loan.to_dict() for loan in loans_taken],
        'summary': {
            'owed_to_me': float(owed_to_me),
            'i_owe': float(i_owe),
            'net_balance': net_balance,
            'pending_received_count': len(pending_requests_received),
            'pending_sent_count': len(pending_requests_sent)
        }
    }), 200

@loans_bp.route('', methods=['POST'])
@jwt_required()
def create_loan_request():
    """Create a loan request (borrower requests money from lender)"""
    borrower_id = int(get_jwt_identity())
    data = request.get_json()
    
    # Validate input using Marshmallow schema
    try:
        schema = LoanRequestSchema()
        validated_data = schema.load(data)
    except ValidationError as e:
        current_app.logger.warning(f"Loan request validation failed for user {borrower_id}: {e.messages}")
        return jsonify({'error': 'Validation failed', 'details': e.messages}), 400
    
    lender_username = sanitize_html(data.get('lender_username', '')) if data.get('lender_username') else None
    
    try:
        amount_decimal = Decimal(str(data['amount']))
    except (ValueError, TypeError, KeyError, InvalidOperation):
        return jsonify({'error': 'Invalid amount format'}), 400
    
    if amount_decimal <= 0:
        return jsonify({'error': 'Amount must be greater than 0'}), 400
    
    lender = User.query.filter_by(username=lender_username).first()
    if not lender:
        return jsonify({'error': 'Lender not found'}), 404
    
    # Prevent requesting from self
    if lender.id == borrower_id:
        return jsonify({'error': 'Cannot request loan from yourself'}), 400
    
    try:
        # Create loan request (no money transfer yet)
        loan = Loan(
            lender_id=lender.id,
            borrower_id=borrower_id,
            amount=amount_decimal,
            description=data.get('description'),
            due_date=datetime.fromisoformat(data['due_date']).date() if data.get('due_date') else None,
            interest_rate=data.get('interest_rate', 0.00),
            status='pending'
        )
        db.session.add(loan)
        db.session.commit()
        
        return jsonify({
            'message': 'Loan request created successfully',
            'loan': loan.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Loan request creation failed: {str(e)}'}), 500

@loans_bp.route('/<int:loan_id>/repay', methods=['POST'])
@jwt_required()
def repay_loan(loan_id):
    user_id = int(get_jwt_identity())
    
    # Lock loan record
    loan = Loan.query.filter_by(id=loan_id).with_for_update().first()
    
    if not loan:
        return jsonify({'error': 'Loan not found'}), 404
    
    if loan.borrower_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    if loan.status == 'repaid':
        return jsonify({'error': 'Loan already fully repaid'}), 400
    
    data = request.get_json()
    
    # Validate amount before Decimal conversion
    if not data.get('amount'):
        return jsonify({'error': 'Amount is required'}), 400
    
    try:
        amount = Decimal(str(data['amount']))
    except (ValueError, TypeError, KeyError, InvalidOperation):
        return jsonify({'error': 'Invalid amount format'}), 400
    
    if amount <= 0:
        return jsonify({'error': 'Amount must be greater than 0'}), 400
    
    # Calculate remaining balance
    remaining = loan.amount - loan.amount_repaid
    if amount > remaining:
        amount = remaining
    
    try:
        # Lock borrower wallet
        borrower_wallet = Wallet.query.filter_by(user_id=user_id).with_for_update().first()
        if not borrower_wallet:
            return jsonify({'error': 'Wallet not found'}), 404
        
        # Check borrower balance
        if borrower_wallet.balance < amount:
            return jsonify({'error': 'Insufficient wallet balance'}), 400
        
        # Lock lender wallet
        lender_wallet = Wallet.query.filter_by(user_id=loan.lender_id).with_for_update().first()
        if not lender_wallet:
            return jsonify({'error': 'Lender wallet not found'}), 404
        
        # Deduct from borrower wallet
        borrower_wallet.balance -= amount
        
        # Credit lender wallet
        lender_wallet.balance += amount
        
        # Update loan amount repaid
        loan.amount_repaid += amount
        
        # Create repayment record
        repayment = LoanRepayment(
            loan_id=loan_id,
            amount=amount
        )
        db.session.add(repayment)
        db.session.flush()  # Get repayment ID
        
        # Create transaction for borrower (money out)
        borrower_transaction = Transaction(
            user_id=user_id,
            transaction_type='loan_repayment',
            transaction_source='main_wallet',
            amount=float(amount),
            status='completed',
            description=f'Loan repayment to {User.query.get(loan.lender_id).username}',
            transaction_metadata={
                'loan_id': loan.id,
                'repayment_id': repayment.id,
                'lender_id': loan.lender_id,
                'remaining_balance': float(loan.amount - loan.amount_repaid)
            },
            completed_at=datetime.utcnow()
        )
        db.session.add(borrower_transaction)
        
        # Create transaction for lender (money in)
        lender_transaction = Transaction(
            user_id=loan.lender_id,
            transaction_type='loan_repayment_received',
            transaction_source='main_wallet',
            amount=float(amount),
            status='completed',
            description=f'Loan repayment from {User.query.get(user_id).username}',
            transaction_metadata={
                'loan_id': loan.id,
                'repayment_id': repayment.id,
                'borrower_id': user_id,
                'remaining_balance': float(loan.amount - loan.amount_repaid)
            },
            completed_at=datetime.utcnow()
        )
        db.session.add(lender_transaction)
        
        # Mark loan as fully repaid if complete
        if loan.amount_repaid >= loan.amount:
            loan.is_fully_repaid = True
            loan.repaid_at = datetime.utcnow()
            loan.status = 'repaid'
        
        db.session.commit()
        
        return jsonify({
            'message': 'Repayment successful',
            'loan': loan.to_dict(),
            'repayment': repayment.to_dict(),
            'transaction': borrower_transaction.to_dict(),
            'wallet_balance': float(borrower_wallet.balance)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Repayment failed: {str(e)}'}), 500

@loans_bp.route('/<int:loan_id>/approve', methods=['POST'])
@jwt_required()
def approve_loan_request(loan_id):
    """Lender approves a pending loan request and transfers money"""
    lender_id = int(get_jwt_identity())
    
    # Lock loan record
    loan = Loan.query.filter_by(id=loan_id).with_for_update().first()
    
    if not loan:
        return jsonify({'error': 'Loan request not found'}), 404
    
    # Only lender can approve
    if loan.lender_id != lender_id:
        return jsonify({'error': 'Only the lender can approve this request'}), 403
    
    # Can only approve pending loans
    if loan.status != 'pending':
        return jsonify({'error': f'Loan request is already {loan.status}'}), 400
    
    try:
        # Lock lender wallet
        lender_wallet = Wallet.query.filter_by(user_id=lender_id).with_for_update().first()
        if not lender_wallet:
            return jsonify({'error': 'Wallet not found'}), 404
        
        # Check lender balance
        if lender_wallet.balance < loan.amount:
            return jsonify({'error': 'Insufficient wallet balance to approve this loan'}), 400
        
        # Lock borrower wallet
        borrower_wallet = Wallet.query.filter_by(user_id=loan.borrower_id).with_for_update().first()
        if not borrower_wallet:
            return jsonify({'error': 'Borrower wallet not found'}), 404
        
        # Transfer money
        lender_wallet.balance -= loan.amount
        borrower_wallet.balance += loan.amount
        
        # Update loan status
        loan.status = 'active'
        
        # Create transaction for lender (money out)
        lender_transaction = Transaction(
            user_id=lender_id,
            transaction_type='loan_disbursement',
            transaction_source='main_wallet',
            amount=float(loan.amount),
            status='completed',
            description=f'Loan approved and given to {loan.borrower.username}',
            transaction_metadata={
                'loan_id': loan.id,
                'borrower_id': loan.borrower_id,
                'borrower_username': loan.borrower.username,
                'due_date': loan.due_date.isoformat() if loan.due_date else None
            },
            completed_at=datetime.utcnow()
        )
        db.session.add(lender_transaction)
        
        # Create transaction for borrower (money in)
        borrower_transaction = Transaction(
            user_id=loan.borrower_id,
            transaction_type='loan_received',
            transaction_source='main_wallet',
            amount=float(loan.amount),
            status='completed',
            description=f'Loan request approved by {loan.lender.username}',
            transaction_metadata={
                'loan_id': loan.id,
                'lender_id': lender_id,
                'due_date': loan.due_date.isoformat() if loan.due_date else None
            },
            completed_at=datetime.utcnow()
        )
        db.session.add(borrower_transaction)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Loan request approved successfully',
            'loan': loan.to_dict(),
            'transaction': lender_transaction.to_dict(),
            'lender_wallet_balance': float(lender_wallet.balance)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Loan approval failed: {str(e)}'}), 500

@loans_bp.route('/<int:loan_id>/decline', methods=['POST'])
@jwt_required()
def decline_loan_request(loan_id):
    """Lender declines a pending loan request"""
    lender_id = int(get_jwt_identity())
    
    # Lock loan record
    loan = Loan.query.filter_by(id=loan_id).with_for_update().first()
    
    if not loan:
        return jsonify({'error': 'Loan request not found'}), 404
    
    # Only lender can decline
    if loan.lender_id != lender_id:
        return jsonify({'error': 'Only the lender can decline this request'}), 403
    
    # Can only decline pending loans
    if loan.status != 'pending':
        return jsonify({'error': f'Loan request is already {loan.status}'}), 400
    
    try:
        # Update loan status
        loan.status = 'declined'
        
        db.session.commit()
        
        return jsonify({
            'message': 'Loan request declined',
            'loan': loan.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Decline failed: {str(e)}'}), 500

@loans_bp.route('/<int:loan_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_loan(loan_id):
    user_id = int(get_jwt_identity())
    
    # Lock loan record
    loan = Loan.query.filter_by(id=loan_id).with_for_update().first()
    
    if not loan:
        return jsonify({'error': 'Loan not found'}), 404
    
    # Only lender can cancel
    if loan.lender_id != user_id:
        return jsonify({'error': 'Only the lender can cancel this loan'}), 403
    
    # Can only cancel active loans (not pending, declined, cancelled, or repaid)
    if loan.status != 'active':
        return jsonify({'error': f'Cannot cancel a {loan.status} loan. Only active loans can be cancelled.'}), 400
    
    # Can only cancel if no repayments made
    if loan.amount_repaid > 0:
        return jsonify({'error': 'Cannot cancel loan with existing repayments. Use repayment feature instead.'}), 400
    
    try:
        # Lock both wallets
        lender_wallet = Wallet.query.filter_by(user_id=loan.lender_id).with_for_update().first()
        borrower_wallet = Wallet.query.filter_by(user_id=loan.borrower_id).with_for_update().first()
        
        if not lender_wallet or not borrower_wallet:
            return jsonify({'error': 'Wallet not found'}), 404
        
        # Check borrower has enough balance to return
        if borrower_wallet.balance < loan.amount:
            return jsonify({'error': 'Borrower has insufficient balance to process cancellation'}), 400
        
        # Reverse the loan transaction
        # Return money to lender
        lender_wallet.balance += loan.amount
        
        # Deduct from borrower
        borrower_wallet.balance -= loan.amount
        
        # Update loan status
        loan.status = 'cancelled'
        loan.is_fully_repaid = False
        loan.cancelled_at = datetime.utcnow()
        
        # Create transaction for lender (money in - refund)
        lender_transaction = Transaction(
            user_id=loan.lender_id,
            transaction_type='loan_cancelled_refund',
            transaction_source='main_wallet',
            amount=float(loan.amount),
            status='completed',
            description=f'Loan cancellation refund from {User.query.get(loan.borrower_id).username}',
            transaction_metadata={
                'loan_id': loan.id,
                'borrower_id': loan.borrower_id,
                'borrower_username': User.query.get(loan.borrower_id).username,
                'original_due_date': loan.due_date.isoformat() if loan.due_date else None
            },
            completed_at=datetime.utcnow()
        )
        db.session.add(lender_transaction)
        
        # Create transaction for borrower (money out - return)
        borrower_transaction = Transaction(
            user_id=loan.borrower_id,
            transaction_type='loan_cancelled_return',
            transaction_source='main_wallet',
            amount=float(loan.amount),
            status='completed',
            description=f'Loan cancellation - returned to {User.query.get(loan.lender_id).username}',
            transaction_metadata={
                'loan_id': loan.id,
                'lender_id': loan.lender_id,
                'original_due_date': loan.due_date.isoformat() if loan.due_date else None
            },
            completed_at=datetime.utcnow()
        )
        db.session.add(borrower_transaction)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Loan cancelled successfully',
            'loan': loan.to_dict(),
            'lender_wallet_balance': float(lender_wallet.balance),
            'transaction': lender_transaction.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Loan cancellation failed: {str(e)}'}), 500

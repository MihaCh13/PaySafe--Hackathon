from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Transaction
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from sqlalchemy import or_

transactions_bp = Blueprint('transactions', __name__)

def get_period_date_range(period='last_12_months', date_from=None, date_to=None):
    """
    Calculate date range based on period preset or custom dates.
    Returns (date_from, date_to, period_label) tuple.
    All dates are in UTC.
    """
    now = datetime.utcnow()
    
    if date_from and date_to:
        # Custom date range
        from_date = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
        to_date = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
        label = f"{from_date.strftime('%b %d, %Y')} - {to_date.strftime('%b %d, %Y')}"
        return (from_date, to_date, label)
    
    # Preset periods
    if period == 'last_30_days':
        from_date = now - timedelta(days=30)
        to_date = now
        label = "Last 30 Days"
    elif period == 'ytd':
        from_date = datetime(now.year, 1, 1)
        to_date = now
        label = f"Year to Date ({now.year})"
    elif period == 'all_time':
        from_date = None
        to_date = None
        label = "All Time"
    else:  # default: last_12_months
        from_date = now - relativedelta(months=12)
        to_date = now
        label = "Last 12 Months"
    
    return (from_date, to_date, label)

@transactions_bp.route('', methods=['GET'])
@transactions_bp.route('/', methods=['GET'])
@jwt_required()
def get_transactions():
    user_id = int(get_jwt_identity())
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    transaction_type = request.args.get('type')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    
    query = Transaction.query.filter(
        or_(
            Transaction.user_id == user_id,
            Transaction.sender_id == user_id,
            Transaction.receiver_id == user_id
        )
    )
    
    if transaction_type:
        query = query.filter_by(transaction_type=transaction_type)
    
    if date_from:
        try:
            from_date = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
            query = query.filter(Transaction.created_at >= from_date)
        except ValueError:
            pass
    
    if date_to:
        try:
            to_date = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
            query = query.filter(Transaction.created_at <= to_date)
        except ValueError:
            pass
    
    query = query.order_by(Transaction.created_at.desc())
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    transactions = [t.to_dict() for t in pagination.items]
    
    return jsonify({
        'transactions': transactions,
        'total': pagination.total,
        'page': page,
        'pages': pagination.pages,
        'per_page': per_page
    }), 200

@transactions_bp.route('/<int:transaction_id>', methods=['GET'])
@jwt_required()
def get_transaction(transaction_id):
    user_id = int(get_jwt_identity())
    
    transaction = Transaction.query.filter_by(id=transaction_id, user_id=user_id).first()
    
    if not transaction:
        return jsonify({'error': 'Transaction not found'}), 404
    
    return jsonify({'transaction': transaction.to_dict()}), 200

@transactions_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_transaction_stats():
    user_id = int(get_jwt_identity())
    
    from sqlalchemy import func
    from app.extensions import db
    from app.models import Wallet
    
    # Get period parameters from query string
    period = request.args.get('period', 'last_12_months')
    date_from_param = request.args.get('date_from')
    date_to_param = request.args.get('date_to')
    
    # Calculate date range
    date_from, date_to, period_label = get_period_date_range(period, date_from_param, date_to_param)
    
    # Build base income query
    income_query = db.session.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_type.in_([
            'topup', 'income', 'refund', 'transfer_received', 
            'loan_repayment_received', 'loan_received', 'savings_withdrawal',
            'sale', 'budget_withdrawal'
        ])
    )
    
    # Build base expense query
    expense_query = db.session.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_type.in_([
            'payment', 'purchase', 'transfer_sent', 'card_payment', 
            'loan_disbursement', 'loan_repayment', 'savings_deposit',
            'budget_allocation', 'budget_expense'
        ])
    )
    
    # Build transaction count query
    count_query = Transaction.query.filter_by(user_id=user_id)
    
    # Apply date filters if not all_time
    if date_from is not None:
        income_query = income_query.filter(Transaction.created_at >= date_from)
        expense_query = expense_query.filter(Transaction.created_at >= date_from)
        count_query = count_query.filter(Transaction.created_at >= date_from)
    
    if date_to is not None:
        income_query = income_query.filter(Transaction.created_at <= date_to)
        expense_query = expense_query.filter(Transaction.created_at <= date_to)
        count_query = count_query.filter(Transaction.created_at <= date_to)
    
    # Execute queries
    total_income = income_query.scalar() or 0
    total_expenses = expense_query.scalar() or 0
    transaction_count = count_query.count()
    
    # Get current wallet balance (not affected by period filter)
    wallet = Wallet.query.filter_by(user_id=user_id).first()
    current_balance = float(wallet.balance) if wallet else 0.0
    
    # Get recent transactions (from the filtered period)
    recent_query = Transaction.query.filter_by(user_id=user_id)
    if date_from is not None:
        recent_query = recent_query.filter(Transaction.created_at >= date_from)
    if date_to is not None:
        recent_query = recent_query.filter(Transaction.created_at <= date_to)
    
    recent_transactions = recent_query.order_by(
        Transaction.created_at.desc()
    ).limit(5).all()
    
    return jsonify({
        'total_income': float(total_income),
        'total_expenses': float(total_expenses),
        'current_balance': current_balance,
        'transaction_count': transaction_count,
        'recent_transactions': [t.to_dict() for t in recent_transactions],
        'period_label': period_label,
        'date_from': date_from.isoformat() if date_from else None,
        'date_to': date_to.isoformat() if date_to else None
    }), 200

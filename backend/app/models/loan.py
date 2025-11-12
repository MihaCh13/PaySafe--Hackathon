from datetime import datetime
from app.extensions import db

class Loan(db.Model):
    __tablename__ = 'loans'
    
    id = db.Column(db.Integer, primary_key=True)
    lender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    borrower_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(db.String(3), default='USD')
    
    amount_repaid = db.Column(db.Numeric(10, 2), default=0.00)
    
    status = db.Column(db.String(20), default='pending', index=True)
    
    description = db.Column(db.String(255))
    due_date = db.Column(db.Date)
    
    interest_rate = db.Column(db.Numeric(5, 2), default=0.00)
    
    is_fully_repaid = db.Column(db.Boolean, default=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    repaid_at = db.Column(db.DateTime)
    cancelled_at = db.Column(db.DateTime)
    
    lender = db.relationship('User', foreign_keys=[lender_id], backref='loans_given')
    borrower = db.relationship('User', foreign_keys=[borrower_id], backref='loans_taken')
    repayments = db.relationship('LoanRepayment', backref='loan', lazy='dynamic', cascade='all, delete-orphan')
    
    @property
    def amount_remaining(self):
        return float(self.amount) - float(self.amount_repaid)
    
    @property
    def is_overdue(self):
        if self.is_fully_repaid or self.status == 'repaid':
            return False
        if self.due_date and datetime.now().date() > self.due_date:
            return True
        return False
    
    @property
    def days_overdue(self):
        if not self.is_overdue:
            return 0
        return (datetime.now().date() - self.due_date).days
    
    def to_dict(self):
        return {
            'id': self.id,
            'lender_id': self.lender_id,
            'borrower_id': self.borrower_id,
            'lender': {'username': self.lender.username} if self.lender else None,
            'borrower': {'username': self.borrower.username} if self.borrower else None,
            'amount': float(self.amount),
            'currency': self.currency,
            'amount_repaid': float(self.amount_repaid),
            'amount_remaining': self.amount_remaining,
            'status': self.status,
            'description': self.description,
            'deadline': self.due_date.isoformat() if self.due_date else None,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'interest_rate': float(self.interest_rate),
            'is_fully_repaid': self.is_fully_repaid,
            'is_overdue': self.is_overdue,
            'days_overdue': self.days_overdue,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'repaid_at': self.repaid_at.isoformat() if self.repaid_at else None,
            'cancelled_at': self.cancelled_at.isoformat() if self.cancelled_at else None
        }

class LoanRepayment(db.Model):
    __tablename__ = 'loan_repayments'
    
    id = db.Column(db.Integer, primary_key=True)
    loan_id = db.Column(db.Integer, db.ForeignKey('loans.id'), nullable=False, index=True)
    
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'loan_id': self.loan_id,
            'amount': float(self.amount),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

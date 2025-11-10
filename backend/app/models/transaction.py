from datetime import datetime
from app.extensions import db

class Transaction(db.Model):
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    transaction_type = db.Column(db.String(50), nullable=False)
    transaction_source = db.Column(db.String(20), default='main_wallet')
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(db.String(3), default='USD')
    
    status = db.Column(db.String(20), default='pending')
    
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    receiver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    description = db.Column(db.String(255))
    transaction_metadata = db.Column(db.JSON)
    
    card_id = db.Column(db.Integer, db.ForeignKey('virtual_cards.id'), nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    completed_at = db.Column(db.DateTime)
    
    sender = db.relationship('User', foreign_keys=[sender_id], backref='sent_transactions')
    receiver = db.relationship('User', foreign_keys=[receiver_id], backref='received_transactions')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'transaction_type': self.transaction_type,
            'transaction_source': self.transaction_source or 'main_wallet',
            'amount': float(self.amount),
            'currency': self.currency,
            'status': self.status,
            'sender_id': self.sender_id,
            'receiver_id': self.receiver_id,
            'description': self.description,
            'metadata': self.transaction_metadata,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }

from datetime import datetime
from app.extensions import db

class Wallet(db.Model):
    __tablename__ = 'wallets'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    
    balance = db.Column(db.Numeric(10, 2), default=0.00, nullable=False)
    currency = db.Column(db.String(3), default='USD', nullable=False)
    
    is_frozen = db.Column(db.Boolean, default=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'balance': float(self.balance),
            'currency': self.currency,
            'is_frozen': self.is_frozen,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

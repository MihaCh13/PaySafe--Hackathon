from datetime import datetime
from app.extensions import db

class Subscription(db.Model):
    __tablename__ = 'subscriptions'
    
    id = db.Column(db.Integer, primary_key=True)
    card_id = db.Column(db.Integer, db.ForeignKey('virtual_cards.id'), nullable=False, index=True)
    
    service_name = db.Column(db.String(100), nullable=False)
    service_category = db.Column(db.String(50))
    
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(db.String(3), default='USD')
    billing_cycle = db.Column(db.String(20), default='monthly')
    
    next_billing_date = db.Column(db.Date)
    last_payment_date = db.Column(db.Date)
    
    is_active = db.Column(db.Boolean, default=True)
    auto_renew = db.Column(db.Boolean, default=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    cancelled_at = db.Column(db.DateTime)
    
    def to_dict(self):
        return {
            'id': self.id,
            'card_id': self.card_id,
            'service_name': self.service_name,
            'service_category': self.service_category,
            'amount': float(self.amount),
            'currency': self.currency,
            'billing_cycle': self.billing_cycle,
            'next_billing_date': self.next_billing_date.isoformat() if self.next_billing_date else None,
            'last_payment_date': self.last_payment_date.isoformat() if self.last_payment_date else None,
            'is_active': self.is_active,
            'auto_renew': self.auto_renew,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

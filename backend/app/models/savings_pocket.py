from datetime import datetime
from app.extensions import db

class SavingsPocket(db.Model):
    __tablename__ = 'savings_pockets'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    name = db.Column(db.String(100), default='DarkDays Pocket')
    balance = db.Column(db.Numeric(10, 2), default=0.00, nullable=False)
    goal_amount = db.Column(db.Numeric(10, 2), default=5000.00)
    
    auto_save_enabled = db.Column(db.Boolean, default=False)
    auto_save_percentage = db.Column(db.Numeric(5, 2), default=20.00)
    auto_save_frequency = db.Column(db.String(20))
    next_auto_save_date = db.Column(db.Date)
    
    pin_protected = db.Column(db.Boolean, default=True)
    
    is_locked = db.Column(db.Boolean, default=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'balance': float(self.balance),
            'goal_amount': float(self.goal_amount) if self.goal_amount is not None else 5000.0,
            'auto_save_enabled': self.auto_save_enabled,
            'auto_save_percentage': float(self.auto_save_percentage),
            'auto_save_frequency': self.auto_save_frequency,
            'next_auto_save_date': self.next_auto_save_date.isoformat() if self.next_auto_save_date else None,
            'is_locked': self.is_locked,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

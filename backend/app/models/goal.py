from datetime import datetime
from app.extensions import db

class Goal(db.Model):
    __tablename__ = 'goals'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    
    target_amount = db.Column(db.Numeric(10, 2), nullable=False)
    current_amount = db.Column(db.Numeric(10, 2), default=0.00)
    currency = db.Column(db.String(3), default='USD')
    
    target_date = db.Column(db.Date)
    
    is_completed = db.Column(db.Boolean, default=False)
    completed_at = db.Column(db.DateTime)
    
    icon = db.Column(db.String(50))
    color = db.Column(db.String(20))
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    @property
    def progress_percentage(self):
        if self.target_amount <= 0:
            return 0
        return min(100, (float(self.current_amount) / float(self.target_amount)) * 100)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'description': self.description,
            'target_amount': float(self.target_amount),
            'current_amount': float(self.current_amount),
            'currency': self.currency,
            'target_date': self.target_date.isoformat() if self.target_date else None,
            'is_completed': self.is_completed,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'progress_percentage': self.progress_percentage,
            'icon': self.icon,
            'color': self.color,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

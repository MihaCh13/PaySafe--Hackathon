from datetime import datetime
from app import db

class ISICCardMetadata(db.Model):
    __tablename__ = 'isic_card_metadata'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    virtual_card_id = db.Column(db.Integer, db.ForeignKey('virtual_cards.id'), nullable=True)
    isic_profile_id = db.Column(db.Integer, db.ForeignKey('isic_profiles.id'), nullable=True)
    
    card_number = db.Column(db.String(50), nullable=True)
    full_name = db.Column(db.String(255), nullable=True)
    date_of_birth = db.Column(db.Date, nullable=True)
    expiry_date = db.Column(db.Date, nullable=True)
    institution = db.Column(db.String(255), nullable=True)
    card_type = db.Column(db.String(20), nullable=True)
    
    screenshot_url = db.Column(db.Text, nullable=True)
    
    verification_status = db.Column(db.String(20), default='pending', nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    user = db.relationship('User', backref=db.backref('isic_cards', lazy=True))
    virtual_card = db.relationship('VirtualCard', backref=db.backref('isic_metadata', uselist=False))
    isic_profile = db.relationship('ISICProfile', backref=db.backref('card_metadata', uselist=False))
    
    def to_dict(self, include_screenshot=True):
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'virtual_card_id': self.virtual_card_id,
            'isic_profile_id': self.isic_profile_id,
            'card_number': self.card_number,
            'full_name': self.full_name,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'expiry_date': self.expiry_date.isoformat() if self.expiry_date else None,
            'institution': self.institution,
            'card_type': self.card_type,
            'screenshot_url': self.screenshot_url if include_screenshot else None,
            'verification_status': self.verification_status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        return data
    
    def __repr__(self):
        return f'<ISICCardMetadata {self.id} - User {self.user_id}>'

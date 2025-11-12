from datetime import datetime, date
from app.extensions import db

class ISICProfile(db.Model):
    __tablename__ = 'isic_profiles'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    isic_number = db.Column(db.String(50), unique=True, nullable=False)
    student_name = db.Column(db.String(100), nullable=False)
    university = db.Column(db.String(100), nullable=False)
    expiry_date = db.Column(db.Date, nullable=False)
    is_verified = db.Column(db.Boolean, default=False)
    qr_code_data = db.Column(db.Text)
    photo_url = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = db.relationship('User', backref=db.backref('isic_profile', uselist=False))
    
    def is_expired(self):
        return date.today() > self.expiry_date
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'isic_number': self.isic_number,
            'student_name': self.student_name,
            'university': self.university,
            'expiry_date': self.expiry_date.strftime('%Y-%m-%d'),
            'is_verified': self.is_verified,
            'is_expired': self.is_expired(),
            'qr_code_data': self.qr_code_data,
            'photo_url': self.photo_url,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

from datetime import datetime
from app.extensions import db
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(20), unique=True, nullable=True, index=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    
    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))
    date_of_birth = db.Column(db.Date)
    
    is_verified = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    
    pin_hash = db.Column(db.String(255), nullable=True)
    
    isic_card_number = db.Column(db.String(50), unique=True, nullable=True)
    university = db.Column(db.String(100))
    faculty = db.Column(db.String(100))
    profile_photo_url = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    wallet = db.relationship('Wallet', backref='user', uselist=False, cascade='all, delete-orphan')
    transactions = db.relationship('Transaction', foreign_keys='Transaction.user_id', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    virtual_cards = db.relationship('VirtualCard', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    savings_pockets = db.relationship('SavingsPocket', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    goals = db.relationship('Goal', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    marketplace_listings = db.relationship('MarketplaceListing', backref='seller', lazy='dynamic', cascade='all, delete-orphan')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def set_pin(self, pin):
        self.pin_hash = generate_password_hash(str(pin))
    
    def check_pin(self, pin):
        if not self.pin_hash:
            return False
        return check_password_hash(self.pin_hash, str(pin))
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'phone': self.phone,
            'username': self.username,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'is_verified': self.is_verified,
            'university': self.university,
            'faculty': self.faculty,
            'profile_photo_url': self.profile_photo_url,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

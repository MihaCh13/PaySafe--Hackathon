from datetime import datetime
from app.extensions import db

class Merchant(db.Model):
    __tablename__ = 'merchants'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    logo_url = db.Column(db.String(255))
    discount_percentage = db.Column(db.Float)
    discount_description = db.Column(db.String(255))
    
    # Online Recognition
    online_domain = db.Column(db.String(100))
    online_url_patterns = db.Column(db.JSON)
    
    # Physical Recognition (NFC/POS)
    pos_merchant_id = db.Column(db.String(100))
    nfc_enabled = db.Column(db.Boolean, default=False)
    
    # Discount Application
    auto_apply_online = db.Column(db.Boolean, default=False)
    requires_verification = db.Column(db.Boolean, default=True)
    
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'logo_url': self.logo_url,
            'discount_percentage': self.discount_percentage,
            'discount_description': self.discount_description,
            'online_domain': self.online_domain,
            'online_url_patterns': self.online_url_patterns,
            'pos_merchant_id': self.pos_merchant_id,
            'nfc_enabled': self.nfc_enabled,
            'auto_apply_online': self.auto_apply_online,
            'requires_verification': self.requires_verification,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat()
        }

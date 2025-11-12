from datetime import datetime
from app.extensions import db

class DiscountApplication(db.Model):
    __tablename__ = 'discount_applications'
    
    id = db.Column(db.Integer, primary_key=True)
    isic_profile_id = db.Column(db.Integer, db.ForeignKey('isic_profiles.id'), nullable=False)
    merchant_id = db.Column(db.Integer, db.ForeignKey('merchants.id'), nullable=False)
    transaction_id = db.Column(db.Integer, db.ForeignKey('transactions.id'), nullable=True)
    original_amount = db.Column(db.Numeric(10, 2), nullable=False)
    discount_amount = db.Column(db.Numeric(10, 2), nullable=False)
    final_amount = db.Column(db.Numeric(10, 2), nullable=False)
    detection_method = db.Column(db.String(20), nullable=False)  # 'online' or 'physical'
    applied_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    isic_profile = db.relationship('ISICProfile', backref='discount_applications')
    merchant = db.relationship('Merchant', backref='discount_applications')
    transaction = db.relationship('Transaction', backref='discount_applications')
    
    def to_dict(self):
        return {
            'id': self.id,
            'isic_profile_id': self.isic_profile_id,
            'merchant_id': self.merchant_id,
            'merchant_name': self.merchant.name if self.merchant else None,
            'transaction_id': self.transaction_id,
            'original_amount': float(self.original_amount),
            'discount_amount': float(self.discount_amount),
            'final_amount': float(self.final_amount),
            'detection_method': self.detection_method,
            'applied_at': self.applied_at.isoformat()
        }

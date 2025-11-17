from datetime import datetime
from app.extensions import db

class MarketplaceListing(db.Model):
    __tablename__ = 'marketplace_listings'
    
    id = db.Column(db.Integer, primary_key=True)
    seller_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(50), index=True)
    
    price = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(db.String(3), default='USD')
    
    university = db.Column(db.String(100), index=True)
    faculty = db.Column(db.String(100))
    course = db.Column(db.String(100))
    
    condition = db.Column(db.String(20))
    
    is_available = db.Column(db.Boolean, default=True, index=True)
    is_sold = db.Column(db.Boolean, default=False, index=True)
    
    images = db.Column(db.JSON)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    orders = db.relationship('MarketplaceOrder', backref='listing', lazy='dynamic')
    
    def to_dict(self, include_seller=False):
        data = {
            'id': self.id,
            'seller_id': self.seller_id,
            'title': self.title,
            'description': self.description,
            'category': self.category,
            'price': float(self.price),
            'currency': self.currency,
            'university': self.university,
            'faculty': self.faculty,
            'course': self.course,
            'condition': self.condition,
            'is_available': self.is_available,
            'is_sold': self.is_sold,
            'images': self.images,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        
        if include_seller and self.seller:
            data['seller'] = {
                'id': self.seller.id,
                'username': self.seller.username,
                'first_name': self.seller.first_name,
                'last_name': self.seller.last_name,
                'university': self.seller.university,
                'faculty': self.seller.faculty,
                'email': self.seller.email,
                'created_at': self.seller.created_at.isoformat() if self.seller.created_at else None
            }
        
        return data

class MarketplaceOrder(db.Model):
    __tablename__ = 'marketplace_orders'
    
    id = db.Column(db.Integer, primary_key=True)
    listing_id = db.Column(db.Integer, db.ForeignKey('marketplace_listings.id'), nullable=False, index=True)
    buyer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    status = db.Column(db.String(20), default='pending', index=True)
    
    escrow_released = db.Column(db.Boolean, default=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    
    buyer = db.relationship('User', backref='marketplace_purchases')
    
    def to_dict(self):
        return {
            'id': self.id,
            'listing_id': self.listing_id,
            'buyer_id': self.buyer_id,
            'amount': float(self.amount),
            'status': self.status,
            'escrow_released': self.escrow_released,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }

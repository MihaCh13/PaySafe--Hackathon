"""
SubscriptionCard Model

Purpose:
    Manages subscription-based virtual cards for recurring service payments.
    Each subscription represents a service (Spotify, Netflix, etc.) linked to a user.

Expected Functions:
    - Create subscription for predefined or custom services
    - Track subscription status (active, paused, pending)
    - Monitor monthly costs and billing dates
    - Calculate total amount paid
    - Provide subscription analytics

Current Implementation Status:
    [DONE] Model definition with all required fields
    [DONE] SQLAlchemy ORM integration
    [DONE] to_dict() serialization method
    [DONE] Database relationships with User model
"""

from datetime import datetime
from app.extensions import db

class SubscriptionCard(db.Model):
    """
    Subscription Card model for managing recurring service payments.
    
    Attributes:
        id: Primary key
        user_id: Foreign key to users table
        service_name: Name of the subscription service (e.g., "Spotify", "Netflix")
        category: Service category (e.g., "streaming", "cloud storage", "education")
        status: Subscription status - "active", "paused", "pending"
        monthly_cost: Monthly subscription amount
        next_billing_date: Date of next automatic payment
        total_paid: Cumulative amount paid for this subscription
        created_at: Timestamp when subscription was created
        updated_at: Timestamp of last update
        
    Status Types:
        - "active": Subscription is active and billing
        - "paused": Temporarily paused, no billing
        - "pending": Awaiting activation or payment
    """
    __tablename__ = 'subscription_cards'
    
    # Primary Key
    id = db.Column(db.Integer, primary_key=True)
    
    # Foreign Key
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Service Information
    service_name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False)  # streaming, cloud, education, etc.
    
    # Subscription Status
    status = db.Column(
        db.String(20), 
        nullable=False, 
        default='active'
    )  # active, paused, pending
    
    # Financial Information
    monthly_cost = db.Column(db.Numeric(10, 2), nullable=False)
    total_paid = db.Column(db.Numeric(10, 2), default=0.00)
    
    # Billing Information
    next_billing_date = db.Column(db.Date, nullable=False)
    last_billing_date = db.Column(db.Date)
    
    # Metadata for custom subscriptions
    is_custom = db.Column(db.Boolean, default=False)  # True if user-defined service
    icon_url = db.Column(db.String(255))  # URL to service icon/logo
    description = db.Column(db.Text)  # Optional description
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref=db.backref('subscription_cards', lazy='dynamic'))
    
    def to_dict(self):
        """
        Convert SubscriptionCard object to dictionary.
        
        Returns:
            dict: Dictionary representation of the subscription
        """
        return {
            'id': self.id,
            'user_id': self.user_id,
            'service_name': self.service_name,
            'category': self.category,
            'status': self.status,
            'monthly_cost': float(self.monthly_cost),
            'total_paid': float(self.total_paid),
            'next_billing_date': self.next_billing_date.isoformat() if self.next_billing_date else None,
            'last_billing_date': self.last_billing_date.isoformat() if self.last_billing_date else None,
            'is_custom': self.is_custom,
            'icon_url': self.icon_url,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<SubscriptionCard {self.service_name} - ${self.monthly_cost}/mo>'

from datetime import datetime
from decimal import Decimal
from app.extensions import db
import random
import string

class VirtualCard(db.Model):
    __tablename__ = 'virtual_cards'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    # Card Purpose: 'payment' for virtual payment cards, 'budget' for budget tracking cards, 'subscription' for subscription management
    card_purpose = db.Column(db.String(20), default='payment', index=True)
    
    # Payment Card Fields
    card_type = db.Column(db.String(20), default='standard')
    card_number = db.Column(db.String(16), unique=True, nullable=True)
    card_name = db.Column(db.String(100))
    cvv = db.Column(db.String(3), nullable=True)
    expiry_date = db.Column(db.Date)
    spending_limit = db.Column(db.Numeric(10, 2))
    is_active = db.Column(db.Boolean, default=True)
    is_frozen = db.Column(db.Boolean, default=False)
    
    # Budget Card Fields
    category = db.Column(db.String(50), nullable=True)
    color = db.Column(db.String(7), default='#6366f1')
    icon = db.Column(db.String(50), default='💳')
    allocated_amount = db.Column(db.Numeric(10, 2), default=0.00)
    spent_amount = db.Column(db.Numeric(10, 2), default=0.00)
    monthly_limit = db.Column(db.Numeric(10, 2), nullable=True)
    auto_allocate = db.Column(db.Boolean, default=False)
    auto_allocate_amount = db.Column(db.Numeric(10, 2), nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_reset_at = db.Column(db.DateTime, nullable=True)
    
    subscriptions = db.relationship('Subscription', backref='card', lazy='dynamic', cascade='all, delete-orphan')
    
    @staticmethod
    def to_decimal(value):
        """Convert value to Decimal for safe arithmetic"""
        if isinstance(value, Decimal):
            return value
        return Decimal(str(value)).quantize(Decimal('0.01'))
    
    @staticmethod
    def generate_card_number(max_retries=10):
        """Generate unique card number with collision detection"""
        for _ in range(max_retries):
            card_number = ''.join([str(random.randint(0, 9)) for _ in range(16)])
            # Check if this number already exists
            existing = VirtualCard.query.filter_by(card_number=card_number).first()
            if not existing:
                return card_number
        # Fallback: add timestamp suffix for absolute uniqueness
        timestamp_suffix = str(int(datetime.utcnow().timestamp()))[-6:]
        base_number = ''.join([str(random.randint(0, 9)) for _ in range(10)])
        return base_number + timestamp_suffix
    
    @staticmethod
    def generate_cvv():
        return ''.join([str(random.randint(0, 9)) for _ in range(3)])
    
    @staticmethod
    def generate_iban():
        """Generate a fake IBAN for virtual cards (format: GB00UNIP1234567890)"""
        return 'GB' + ''.join([str(random.randint(0, 9)) for _ in range(2)]) + 'UNIP' + ''.join([str(random.randint(0, 9)) for _ in range(10)])
    
    @staticmethod
    def generate_swift():
        """Generate a fake SWIFT/BIC code for virtual cards (format: UNIPGB2L)"""
        return 'UNIPGB2L'
    
    def get_iban(self):
        """Get or generate IBAN for all card types"""
        # Generate based on card_id for consistency
        random.seed(self.id)
        iban = self.generate_iban()
        random.seed()  # Reset seed
        return iban
    
    def get_swift(self):
        """Get SWIFT/BIC code for all card types"""
        return self.generate_swift()
    
    # Budget Card Methods
    def get_remaining_balance(self):
        """Get remaining budget (allocated - spent)"""
        if self.card_purpose != 'budget':
            return 0
        return float(self.allocated_amount - self.spent_amount)
    
    def get_spent_percentage(self):
        """Get percentage of budget spent"""
        if self.card_purpose != 'budget' or self.allocated_amount == 0:
            return 0
        return float((self.spent_amount / self.allocated_amount) * 100)
    
    def can_spend(self, amount):
        """Check if card has enough budget to spend"""
        if self.card_purpose != 'budget':
            return False
        amount_decimal = self.to_decimal(amount)
        
        # Check allocated budget
        remaining = self.allocated_amount - self.spent_amount
        if remaining < amount_decimal:
            return False
        
        # Check monthly limit if set
        if self.monthly_limit is not None:
            if self.spent_amount + amount_decimal > self.monthly_limit:
                return False
        
        return True
    
    def spend(self, amount):
        """Record spending from budget card with monthly limit validation"""
        if self.card_purpose != 'budget':
            raise ValueError("Can only spend from budget cards")
        
        amount_decimal = self.to_decimal(amount)
        remaining = self.allocated_amount - self.spent_amount
        
        # Check allocated budget
        if remaining < amount_decimal:
            raise ValueError(f"Insufficient budget in {self.card_name}. Available: ${float(remaining):.2f}")
        
        # Check monthly limit if set
        if self.monthly_limit is not None:
            if self.spent_amount + amount_decimal > self.monthly_limit:
                available = float(self.monthly_limit - self.spent_amount)
                raise ValueError(f"Spending exceeds monthly limit. Available: ${available:.2f} of ${float(self.monthly_limit):.2f}")
        
        self.spent_amount += amount_decimal
        self.updated_at = datetime.utcnow()
    
    def allocate(self, amount):
        """Allocate funds to budget card"""
        if self.card_purpose != 'budget':
            raise ValueError("Can only allocate to budget cards")
        amount_decimal = self.to_decimal(amount)
        self.allocated_amount += amount_decimal
        self.updated_at = datetime.utcnow()
    
    def to_dict(self, include_sensitive=False):
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'card_purpose': self.card_purpose,
            'card_name': self.card_name,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        
        # Payment card fields
        if self.card_purpose == 'payment':
            data['card_type'] = self.card_type
            data['card_number_last4'] = self.card_number[-4:] if self.card_number else None
            data['expiry_date'] = self.expiry_date.isoformat() if self.expiry_date else None
            data['spending_limit'] = float(self.spending_limit) if self.spending_limit else None
            data['is_frozen'] = self.is_frozen
            
            if include_sensitive:
                data['card_number'] = self.card_number
                data['cvv'] = self.cvv
                data['iban'] = self.get_iban()
                data['swift'] = self.get_swift()
        
        # Budget card fields
        elif self.card_purpose == 'budget':
            data['category'] = self.category
            data['color'] = self.color
            data['icon'] = self.icon
            data['allocated_amount'] = float(self.allocated_amount)
            data['spent_amount'] = float(self.spent_amount)
            data['remaining_balance'] = self.get_remaining_balance()
            data['spent_percentage'] = self.get_spent_percentage()
            data['monthly_limit'] = float(self.monthly_limit) if self.monthly_limit else None
            data['auto_allocate'] = self.auto_allocate
            data['auto_allocate_amount'] = float(self.auto_allocate_amount) if self.auto_allocate_amount else None
            data['last_reset_at'] = self.last_reset_at.isoformat() if self.last_reset_at else None
            
            if include_sensitive:
                data['iban'] = self.get_iban()
                data['swift'] = self.get_swift()
        
        # Subscription card fields
        elif self.card_purpose == 'subscription':
            data['category'] = self.category
            data['color'] = self.color
            data['icon'] = self.icon
            
            # Financial data (same as budget cards)
            data['allocated_amount'] = float(self.allocated_amount)
            data['spent_amount'] = float(self.spent_amount)
            data['remaining_balance'] = self.get_remaining_balance()
            data['spent_percentage'] = self.get_spent_percentage()
            
            # Get subscription summary
            subscriptions_list = self.subscriptions.all()
            data['subscription_count'] = len(subscriptions_list)
            data['subscriptions'] = [sub.to_dict() for sub in subscriptions_list]
            
            # Calculate total monthly spend
            total_monthly = sum(
                float(sub.amount) for sub in subscriptions_list 
                if sub.is_active and sub.billing_cycle == 'monthly'
            )
            total_yearly = sum(
                float(sub.amount) / 12 for sub in subscriptions_list 
                if sub.is_active and sub.billing_cycle == 'yearly'
            )
            data['total_monthly_spend'] = total_monthly + total_yearly
            
            # Next billing date
            active_subs = [sub for sub in subscriptions_list if sub.is_active and sub.next_billing_date]
            if active_subs:
                next_billing = min(sub.next_billing_date for sub in active_subs)
                data['next_billing_date'] = next_billing.isoformat()
            else:
                data['next_billing_date'] = None
            
            if include_sensitive:
                data['iban'] = self.get_iban()
                data['swift'] = self.get_swift()
        
        return data

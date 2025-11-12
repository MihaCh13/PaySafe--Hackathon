"""
Input validation and sanitization utilities for UniPay.
Provides protection against XSS, SQL injection, and invalid inputs.
"""
import bleach
from marshmallow import Schema, fields, validates, ValidationError
import re
import base64
from typing import Tuple, Any

# HTML sanitization settings - NO HTML allowed in our app
ALLOWED_HTML_TAGS = []
ALLOWED_ATTRIBUTES = {}

def sanitize_html(text: Any) -> Any:
    """
    Remove all HTML tags and scripts from user input.
    
    Args:
        text: Input text to sanitize
        
    Returns:
        Sanitized text with all HTML removed
    """
    if not text or not isinstance(text, str):
        return text
    return bleach.clean(text, tags=ALLOWED_HTML_TAGS, attributes=ALLOWED_ATTRIBUTES, strip=True)


def validate_email(email: str) -> bool:
    """
    Validate email format using regex.
    
    Args:
        email: Email address to validate
        
    Returns:
        True if valid email format, False otherwise
    """
    if not email or not isinstance(email, str):
        return False
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_username(username: str) -> bool:
    """
    Validate username (alphanumeric, underscore, dash only, 3-30 chars).
    
    Args:
        username: Username to validate
        
    Returns:
        True if valid username format, False otherwise
    """
    if not username or not isinstance(username, str):
        return False
    pattern = r'^[a-zA-Z0-9_-]{3,30}$'
    return bool(re.match(pattern, username))


def validate_amount(amount: Any) -> Tuple[bool, str]:
    """
    Validate monetary amount.
    
    Args:
        amount: Amount to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    try:
        val = float(amount)
        if val <= 0:
            return False, "Amount must be positive"
        if val > 1000000:
            return False, "Amount exceeds maximum ($1,000,000)"
        return True, ""
    except (ValueError, TypeError):
        return False, "Invalid amount format"


def validate_pin(pin: Any) -> Tuple[bool, str]:
    """
    Validate PIN format (exactly 4 digits).
    
    Args:
        pin: PIN to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    pin_str = str(pin)
    if not pin_str.isdigit():
        return False, "PIN must contain only digits"
    if len(pin_str) != 4:
        return False, "PIN must be exactly 4 digits"
    return True, ""


def validate_base64_image(base64_string: str, max_size_mb: int = 5) -> Tuple[bool, str]:
    """
    Validate base64-encoded image data.
    
    Checks:
    - Valid base64 encoding
    - File size within limits
    - Image data format (data:image/...)
    
    Args:
        base64_string: Base64 encoded image string
        max_size_mb: Maximum allowed size in megabytes
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not base64_string or not isinstance(base64_string, str):
        return False, "Image data is required"
    
    # Check if it's a data URI
    if base64_string.startswith('data:image'):
        try:
            # Extract the base64 part after the comma
            header, data = base64_string.split(',', 1)
            
            # Validate image type
            allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
            image_type = header.split(':')[1].split(';')[0]
            
            if image_type not in allowed_types:
                return False, f"Invalid image type: {image_type}. Allowed: {allowed_types}"
            
            # Decode base64 to check validity and size
            try:
                decoded = base64.b64decode(data)
            except Exception:
                return False, "Invalid base64 encoding"
            
            # Check size
            size_mb = len(decoded) / (1024 * 1024)
            if size_mb > max_size_mb:
                return False, f"Image too large ({size_mb:.1f}MB). Maximum: {max_size_mb}MB"
            
            return True, ""
            
        except Exception as e:
            return False, f"Invalid image data format: {str(e)}"
    else:
        # If it's raw base64 without data URI
        try:
            decoded = base64.b64decode(base64_string)
            size_mb = len(decoded) / (1024 * 1024)
            if size_mb > max_size_mb:
                return False, f"Image too large ({size_mb:.1f}MB). Maximum: {max_size_mb}MB"
            return True, ""
        except Exception:
            return False, "Invalid base64 encoding"


# Marshmallow schemas for request validation

class TransferSchema(Schema):
    """Schema for P2P transfer requests"""
    recipient = fields.Str(required=True)
    amount = fields.Float(required=True)
    description = fields.Str(required=False, allow_none=True)
    
    @validates('recipient')
    def validate_recipient(self, value, **kwargs):
        # Sanitize recipient username
        sanitized = sanitize_html(value)
        if not sanitized or len(sanitized.strip()) == 0:
            raise ValidationError("Recipient is required")
        if len(sanitized) > 30:
            raise ValidationError("Recipient username too long")
    
    @validates('amount')
    def validate_amount_field(self, value, **kwargs):
        valid, error_msg = validate_amount(value)
        if not valid:
            raise ValidationError(error_msg)
    
    @validates('description')
    def validate_description(self, value, **kwargs):
        if value and len(value) > 200:
            raise ValidationError("Description too long (max 200 characters)")


class TopUpSchema(Schema):
    """Schema for wallet top-up requests"""
    amount = fields.Float(required=True)
    method = fields.Str(required=True)
    
    @validates('amount')
    def validate_amount_field(self, value, **kwargs):
        if value <= 0:
            raise ValidationError("Amount must be positive")
        if value < 5:
            raise ValidationError("Minimum top-up is $5")
        if value > 10000:
            raise ValidationError("Maximum top-up is $10,000 per transaction")
    
    @validates('method')
    def validate_method(self, value, **kwargs):
        valid_methods = ['card', 'bank', 'qr']
        if value.lower() not in valid_methods:
            raise ValidationError(f"Invalid payment method. Must be one of: {valid_methods}")


class RegisterSchema(Schema):
    """Schema for user registration"""
    email = fields.Email(required=True)
    username = fields.Str(required=True)
    password = fields.Str(required=True)
    pin = fields.Str(required=True)
    phone = fields.Str(required=False, allow_none=True)
    first_name = fields.Str(required=False, allow_none=True)
    last_name = fields.Str(required=False, allow_none=True)
    university = fields.Str(required=False, allow_none=True)
    faculty = fields.Str(required=False, allow_none=True)
    
    @validates('username')
    def validate_username_field(self, value, **kwargs):
        if not validate_username(value):
            raise ValidationError("Username must be 3-30 characters, alphanumeric, underscore, or dash only")
    
    @validates('password')
    def validate_password(self, value, **kwargs):
        if len(value) < 8:
            raise ValidationError("Password must be at least 8 characters")
        if len(value) > 100:
            raise ValidationError("Password too long")
    
    @validates('pin')
    def validate_pin_field(self, value, **kwargs):
        valid, error_msg = validate_pin(value)
        if not valid:
            raise ValidationError(error_msg)


class LoginSchema(Schema):
    """Schema for user login"""
    email = fields.Email(required=True)
    password = fields.Str(required=True)
    
    @validates('password')
    def validate_password(self, value, **kwargs):
        if not value or len(value) == 0:
            raise ValidationError("Password is required")


class MarketplaceListingSchema(Schema):
    """Schema for marketplace listing creation"""
    title = fields.Str(required=True)
    description = fields.Str(required=True)
    price = fields.Float(required=True)
    category = fields.Str(required=True)
    
    @validates('title')
    def validate_title(self, value, **kwargs):
        sanitized = sanitize_html(value)
        if not sanitized or len(sanitized.strip()) == 0:
            raise ValidationError("Title is required")
        if len(sanitized) > 100:
            raise ValidationError("Title too long (max 100 characters)")
    
    @validates('description')
    def validate_description(self, value, **kwargs):
        sanitized = sanitize_html(value)
        if not sanitized or len(sanitized.strip()) == 0:
            raise ValidationError("Description is required")
        if len(sanitized) > 1000:
            raise ValidationError("Description too long (max 1000 characters)")
    
    @validates('price')
    def validate_price(self, value, **kwargs):
        valid, error_msg = validate_amount(value)
        if not valid:
            raise ValidationError(error_msg)
        if value < 1:
            raise ValidationError("Minimum price is $1")
    
    @validates('category')
    def validate_category(self, value, **kwargs):
        valid_categories = ['textbooks', 'electronics', 'furniture', 'clothing', 'other']
        if value.lower() not in valid_categories:
            raise ValidationError(f"Invalid category. Must be one of: {valid_categories}")


class LoanRequestSchema(Schema):
    """Schema for P2P loan requests"""
    amount = fields.Float(required=True)
    reason = fields.Str(required=True)
    repayment_date = fields.DateTime(required=False, allow_none=True)
    
    @validates('amount')
    def validate_amount_field(self, value, **kwargs):
        valid, error_msg = validate_amount(value)
        if not valid:
            raise ValidationError(error_msg)
        if value < 10:
            raise ValidationError("Minimum loan amount is $10")
        if value > 5000:
            raise ValidationError("Maximum loan amount is $5,000")
    
    @validates('reason')
    def validate_reason(self, value, **kwargs):
        sanitized = sanitize_html(value)
        if not sanitized or len(sanitized.strip()) == 0:
            raise ValidationError("Reason is required")
        if len(sanitized) > 500:
            raise ValidationError("Reason too long (max 500 characters)")

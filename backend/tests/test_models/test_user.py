"""
Unit tests for User model
Tests authentication and PIN management
"""
import pytest
from app.models import User


@pytest.mark.unit
class TestUserModel:
    """Test User model methods"""
    
    def test_password_hashing(self):
        """Test password is hashed, not stored as plaintext"""
        user = User()
        user.set_password('TestPassword123!')
        
        assert user.password_hash is not None
        assert user.password_hash != 'TestPassword123!'
        assert len(user.password_hash) > 20  # Hashed passwords are long
    
    def test_password_verification_success(self):
        """Test correct password verification"""
        user = User()
        user.set_password('TestPassword123!')
        
        assert user.check_password('TestPassword123!') is True
    
    def test_password_verification_failure(self):
        """Test incorrect password verification"""
        user = User()
        user.set_password('TestPassword123!')
        
        assert user.check_password('WrongPassword') is False
    
    def test_pin_hashing(self):
        """Test PIN is hashed, not stored as plaintext"""
        user = User()
        user.set_pin('1234')
        
        assert user.pin_hash is not None
        assert user.pin_hash != '1234'
    
    def test_pin_verification_success(self):
        """Test correct PIN verification"""
        user = User()
        user.set_pin('1234')
        
        assert user.check_pin('1234') is True
    
    def test_pin_verification_failure(self):
        """Test incorrect PIN verification"""
        user = User()
        user.set_pin('1234')
        
        assert user.check_pin('4321') is False
    
    def test_different_passwords_produce_different_hashes(self):
        """Test same password hashed differently each time (salt)"""
        user1 = User()
        user2 = User()
        
        user1.set_password('SamePassword')
        user2.set_password('SamePassword')
        
        assert user1.password_hash != user2.password_hash

"""
Unit tests for Wallet model
Tests balance operations and validation
"""
import pytest
from app.models import Wallet
from decimal import Decimal


@pytest.mark.unit
class TestWalletModel:
    """Test Wallet model operations"""
    
    def test_wallet_initial_balance(self):
        """Test wallet can be created with initial balance"""
        wallet = Wallet()
        wallet.balance = Decimal('100.00')
        
        assert wallet.balance == Decimal('100.00')
    
    def test_wallet_balance_precision(self):
        """Test wallet maintains 2 decimal precision"""
        wallet = Wallet()
        wallet.balance = Decimal('100.50')
        
        assert wallet.balance == Decimal('100.50')
        assert str(wallet.balance) == '100.50'
    
    def test_wallet_negative_balance_possible(self):
        """Test wallet can go negative (overdraft scenario)"""
        wallet = Wallet()
        wallet.balance = Decimal('50.00')
        wallet.balance -= Decimal('60.00')
        
        assert wallet.balance == Decimal('-10.00')

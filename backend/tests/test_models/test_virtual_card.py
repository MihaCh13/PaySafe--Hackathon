"""
Unit tests for VirtualCard model
Tests budget validation and spending limit enforcement (Sprint 2 C-6 fix)
"""
import pytest
from app.models import VirtualCard
from decimal import Decimal


@pytest.mark.unit
class TestVirtualCardBudgetValidation:
    """Test budget card spending limit validation"""
    
    def test_can_spend_within_allocated_budget(self):
        """Test spending within allocated budget succeeds"""
        card = VirtualCard()
        card.card_purpose = 'budget'
        card.allocated_amount = Decimal('100.00')
        card.spent_amount = Decimal('50.00')
        card.monthly_limit = Decimal('100.00')
        
        can_spend = card.can_spend(Decimal('40.00'))
        
        assert can_spend is True
    
    def test_cannot_exceed_allocated_budget(self):
        """Test spending exceeding allocated budget is rejected"""
        card = VirtualCard()
        card.card_purpose = 'budget'
        card.allocated_amount = Decimal('100.00')
        card.spent_amount = Decimal('90.00')
        card.monthly_limit = Decimal('200.00')
        
        can_spend = card.can_spend(Decimal('20.00'))
        
        assert can_spend is False
    
    def test_cannot_exceed_monthly_spending_limit(self):
        """Test spending exceeding monthly limit is rejected"""
        card = VirtualCard()
        card.card_purpose = 'budget'
        card.allocated_amount = Decimal('200.00')
        card.spent_amount = Decimal('50.00')
        card.monthly_limit = Decimal('100.00')
        
        can_spend = card.can_spend(Decimal('60.00'))
        
        assert can_spend is False
    
    def test_spend_method_validates_budget(self):
        """Test spend() method enforces budget limits"""
        card = VirtualCard()
        card.card_purpose = 'budget'
        card.allocated_amount = Decimal('100.00')
        card.spent_amount = Decimal('95.00')
        card.monthly_limit = Decimal('100.00')
        
        with pytest.raises(ValueError, match="Insufficient budget"):
            card.spend(Decimal('10.00'))
        
        assert card.spent_amount == Decimal('95.00')  # Amount not changed
    
    def test_spend_method_updates_amounts_on_success(self):
        """Test spend() method updates spending on success"""
        card = VirtualCard()
        card.card_purpose = 'budget'
        card.card_name = 'Test Budget'
        card.allocated_amount = Decimal('100.00')
        card.spent_amount = Decimal('50.00')
        card.monthly_limit = Decimal('100.00')
        
        card.spend(Decimal('30.00'))
        
        assert card.spent_amount == Decimal('80.00')
    
    def test_no_budget_limit_allows_any_amount(self):
        """Test cards without monthly limits allow spending up to allocated budget"""
        card = VirtualCard()
        card.card_purpose = 'budget'
        card.allocated_amount = Decimal('100.00')
        card.spent_amount = Decimal('0.00')
        card.monthly_limit = None
        
        can_spend = card.can_spend(Decimal('100.00'))
        
        assert can_spend is True
    
    def test_exact_budget_amount_allowed(self):
        """Test spending exactly the remaining budget succeeds"""
        card = VirtualCard()
        card.card_purpose = 'budget'
        card.allocated_amount = Decimal('100.00')
        card.spent_amount = Decimal('70.00')
        card.monthly_limit = Decimal('100.00')
        
        can_spend = card.can_spend(Decimal('30.00'))
        
        assert can_spend is True
    
    def test_non_budget_card_cannot_spend(self):
        """Test non-budget cards return False from can_spend"""
        card = VirtualCard()
        card.card_purpose = 'payment'
        
        can_spend = card.can_spend(Decimal('50.00'))
        
        assert can_spend is False
    
    def test_spend_on_non_budget_card_raises(self):
        """Test spend() raises ValueError for non-budget cards"""
        card = VirtualCard()
        card.card_purpose = 'payment'
        
        with pytest.raises(ValueError, match="Can only spend from budget cards"):
            card.spend(Decimal('50.00'))

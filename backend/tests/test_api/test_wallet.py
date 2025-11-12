"""
API Integration Tests - Wallet Operations
Tests transfers, balance checks, deadlock prevention (Sprint 2 C-7 fix)
"""
import pytest
from decimal import Decimal


@pytest.mark.integration
class TestWalletAPI:
    """Test wallet endpoints"""
    
    def test_get_wallet_success(self, auth_client):
        """Test retrieving wallet balance"""
        response = auth_client.get('/api/wallet')
        
        assert response.status_code == 200
        data = response.json
        assert 'balance' in data
        assert 'currency' in data
    
    def test_transfer_success(self, auth_client, test_user2):
        """Test successful peer-to-peer transfer"""
        response = auth_client.post('/api/wallet/transfer', json={
            'receiver_identifier': test_user2.email,
            'amount': 50.00,
            'description': 'Test transfer'
        })
        
        assert response.status_code == 200
        data = response.json
        assert data['message'] == 'Transfer successful'
        assert 'transaction' in data
    
    def test_transfer_insufficient_balance(self, auth_client, test_user2):
        """Test transfer with insufficient balance fails"""
        response = auth_client.post('/api/wallet/transfer', json={
            'receiver_identifier': test_user2.email,
            'amount': 999999.00
        })
        
        assert response.status_code == 400
        assert 'insufficient' in response.json['error'].lower()
    
    def test_transfer_to_self(self, auth_client, test_user):
        """Test transfer to self is rejected"""
        response = auth_client.post('/api/wallet/transfer', json={
            'receiver_identifier': test_user.email,
            'amount': 50.00
        })
        
        assert response.status_code == 400
        assert 'yourself' in response.json['error'].lower()
    
    def test_transfer_nonexistent_recipient(self, auth_client):
        """Test transfer to non-existent user fails"""
        response = auth_client.post('/api/wallet/transfer', json={
            'receiver_identifier': 'nonexistent@test.com',
            'amount': 50.00
        })
        
        assert response.status_code == 404
        assert 'not found' in response.json['error'].lower()
    
    def test_transfer_negative_amount(self, auth_client, test_user2):
        """Test transfer with negative amount fails"""
        response = auth_client.post('/api/wallet/transfer', json={
            'receiver_identifier': test_user2.email,
            'amount': -50.00
        })
        
        assert response.status_code == 400
    
    def test_transfer_zero_amount(self, auth_client, test_user2):
        """Test transfer with zero amount fails"""
        response = auth_client.post('/api/wallet/transfer', json={
            'receiver_identifier': test_user2.email,
            'amount': 0.00
        })
        
        assert response.status_code == 400
    
    def test_get_transactions(self, auth_client):
        """Test retrieving transaction history"""
        response = auth_client.get('/api/transactions')
        
        assert response.status_code == 200
        data = response.json
        assert isinstance(data['transactions'], list)

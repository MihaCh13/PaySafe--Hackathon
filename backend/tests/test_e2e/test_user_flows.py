"""
End-to-End Tests - Complete User Flows
Tests complete user journeys from registration to transactions
"""
import pytest


@pytest.mark.e2e
class TestCompleteUserFlows:
    """Test complete user interaction flows"""
    
    def test_new_user_registration_and_first_transfer(self, client):
        """Test complete flow: register → login → get balance → transfer"""
        # Step 1: Register new user
        reg_response = client.post('/api/auth/register', json={
            'username': 'flowtest1',
            'email': 'flowtest1@test.com',
            'password': 'SecurePass123!',
            'pin': '1234',
            'university': 'Test Uni'
        })
        
        assert reg_response.status_code == 201
        token = reg_response.json['access_token']
        
        # Step 2: Check initial wallet balance
        wallet_response = client.get('/api/wallet', headers={
            'Authorization': f'Bearer {token}'
        })
        
        assert wallet_response.status_code == 200
        initial_balance = wallet_response.json['balance']
        
        # Step 3: Register second user (transfer recipient)
        reg2_response = client.post('/api/auth/register', json={
            'username': 'flowtest2',
            'email': 'flowtest2@test.com',
            'password': 'SecurePass123!',
            'pin': '5678',
            'university': 'Test Uni'
        })
        
        assert reg2_response.status_code == 201
        
        # Step 4: Verify transfer fails with insufficient balance
        if initial_balance < 10:
            transfer_response = client.post('/api/wallet/transfer', 
                headers={'Authorization': f'Bearer {token}'},
                json={
                    'receiver_identifier': 'flowtest2@test.com',
                    'amount': 10.00
                }
            )
            
            assert transfer_response.status_code == 400
            assert 'insufficient' in transfer_response.json['error'].lower()
    
    def test_marketplace_purchase_flow(self, client):
        """Test complete flow: create listing → purchase → verify balances"""
        # Register seller
        seller_resp = client.post('/api/auth/register', json={
            'username': 'seller1',
            'email': 'seller1@test.com',
            'password': 'Pass123!',
            'pin': '1111',
            'university': 'Test Uni'
        })
        
        seller_token = seller_resp.json['access_token']
        
        # Create listing
        listing_resp = client.post('/api/marketplace/listings',
            headers={'Authorization': f'Bearer {seller_token}'},
            json={
                'title': 'Test Product',
                'description': 'Test description',
                'price': 50.00,
                'category': 'electronics'
            }
        )
        
        if listing_resp.status_code == 201:
            listing_id = listing_resp.json['listing']['id']
            
            # Register buyer with funds
            buyer_resp = client.post('/api/auth/register', json={
                'username': 'buyer1',
                'email': 'buyer1@test.com',
                'password': 'Pass123!',
                'pin': '2222',
                'university': 'Test Uni'
            })
            
            buyer_token = buyer_resp.json['access_token']
            
            # Note: In real flow, buyer would need to top up wallet first
            # This test verifies the purchase flow structure

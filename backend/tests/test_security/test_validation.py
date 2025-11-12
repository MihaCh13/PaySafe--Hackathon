"""
Security Tests - Input Validation
Tests XSS prevention, SQL injection protection (Sprint 1 C-3 fix)
"""
import pytest


@pytest.mark.security
class TestInputValidation:
    """Test input validation and sanitization"""
    
    def test_xss_prevention_in_transfer_description(self, auth_client, test_user2):
        """Test XSS payloads are sanitized in transfer descriptions"""
        xss_payload = '<script>alert("XSS")</script>'
        
        response = auth_client.post('/api/wallet/transfer', json={
            'receiver_identifier': test_user2.email,
            'amount': 10.00,
            'description': xss_payload
        })
        
        # Transfer should succeed but script tags should be removed
        assert response.status_code == 200
        transaction = response.json['transaction']
        assert '<script>' not in transaction['description']
        assert 'alert' not in transaction['description']
    
    def test_sql_injection_prevention_in_login(self, client):
        """Test SQL injection attempts in login are prevented"""
        sql_injection = "admin' OR '1'='1"
        
        response = client.post('/api/auth/login', json={
            'email': sql_injection,
            'password': 'anything'
        })
        
        # Should fail authentication, not return unexpected results
        assert response.status_code in [400, 401, 422]
    
    def test_html_tags_removed_from_marketplace_title(self, auth_client):
        """Test HTML tags are removed from marketplace listings"""
        response = auth_client.post('/api/marketplace/listings', json={
            'title': '<b>Bold Title</b>',
            'description': 'Normal description',
            'price': 25.00,
            'category': 'textbooks'
        })
        
        assert response.status_code == 201
        listing = response.json['listing']
        assert '<b>' not in listing['title']
        assert '</b>' not in listing['title']
    
    def test_javascript_removed_from_loan_reason(self, auth_client):
        """Test JavaScript is removed from loan request reasons"""
        response = auth_client.post('/api/loans', json={
            'lender_identifier': 'other@test.com',
            'amount': 100.00,
            'reason': '<script>doSomethingMalicious()</script>Need money'
        })
        
        # Request validation should sanitize the reason
        # Even if it fails for other reasons, script should be removed
        if response.status_code == 201:
            loan = response.json['loan']
            assert '<script>' not in loan['description']
    
    def test_oversized_input_rejected(self, auth_client, test_user2):
        """Test extremely long inputs are rejected"""
        long_description = 'A' * 10000  # 10,000 characters
        
        response = auth_client.post('/api/wallet/transfer', json={
            'receiver_identifier': test_user2.email,
            'amount': 10.00,
            'description': long_description
        })
        
        assert response.status_code == 400
    
    def test_special_characters_in_username(self, client):
        """Test special characters in username are rejected"""
        response = client.post('/api/auth/register', json={
            'username': 'user<>@#$%',
            'email': 'test@test.com',
            'password': 'Password123!',
            'pin': '1234'
        })
        
        assert response.status_code == 400
        assert 'username' in response.json['error'].lower()

"""
API Integration Tests - Authentication
Tests login, register, rate limiting (Sprint 1 C-1 fix)
"""
import pytest
import time


@pytest.mark.integration
class TestAuthenticationAPI:
    """Test authentication endpoints"""
    
    def test_register_success(self, client):
        """Test successful user registration"""
        response = client.post('/api/auth/register', json={
            'username': 'newuser',
            'email': 'newuser@test.com',
            'password': 'SecurePass123!',
            'pin': '1234',
            'university': 'Test University'
        })
        
        assert response.status_code == 201
        data = response.json
        assert 'access_token' in data
        assert data['user']['email'] == 'newuser@test.com'
    
    def test_register_duplicate_email(self, client, test_user):
        """Test registration with existing email fails"""
        response = client.post('/api/auth/register', json={
            'username': 'anotheruser',
            'email': test_user.email,
            'password': 'SecurePass123!',
            'pin': '1234',
            'university': 'Test University'
        })
        
        assert response.status_code == 400
        assert 'already exists' in response.json['error'].lower()
    
    def test_register_invalid_password(self, client):
        """Test registration with short password fails"""
        response = client.post('/api/auth/register', json={
            'username': 'testuser3',
            'email': 'test3@example.com',
            'password': 'short',
            'pin': '1234'
        })
        
        assert response.status_code == 400
        assert 'password' in response.json['error'].lower()
    
    def test_login_success(self, client, test_user):
        """Test successful login"""
        response = client.post('/api/auth/login', json={
            'email': test_user.email,
            'password': 'TestPass123!'
        })
        
        assert response.status_code == 200
        data = response.json
        assert 'access_token' in data
        assert data['user']['email'] == test_user.email
    
    def test_login_wrong_password(self, client, test_user):
        """Test login with incorrect password fails"""
        response = client.post('/api/auth/login', json={
            'email': test_user.email,
            'password': 'WrongPassword'
        })
        
        assert response.status_code == 401
        assert 'invalid' in response.json['error'].lower()
    
    def test_login_nonexistent_user(self, client):
        """Test login with non-existent email fails"""
        response = client.post('/api/auth/login', json={
            'email': 'nonexistent@test.com',
            'password': 'SomePassword'
        })
        
        assert response.status_code == 401
    
    def test_login_rate_limiting(self, client, test_user):
        """Test rate limiting on login endpoint (Sprint 1 C-1 fix)"""
        # Make 6 login attempts (limit is 5 per minute)
        for i in range(6):
            response = client.post('/api/auth/login', json={
                'email': test_user.email,
                'password': 'WrongPassword'
            })
            
            if i < 5:
                assert response.status_code in [401, 429]  # Either auth failure or rate limit
            else:
                assert response.status_code == 429  # 6th should be rate limited
        
        time.sleep(60)  # Wait for rate limit to reset
    
    def test_protected_endpoint_without_token(self, client):
        """Test accessing protected endpoint without JWT fails"""
        response = client.get('/api/wallet')
        
        assert response.status_code == 401
    
    def test_protected_endpoint_with_invalid_token(self, client):
        """Test accessing protected endpoint with invalid JWT fails"""
        response = client.get('/api/wallet', headers={
            'Authorization': 'Bearer invalid_token_here'
        })
        
        assert response.status_code == 422  # JWT decode error

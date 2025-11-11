"""
Pytest Configuration and Fixtures
Provides reusable test fixtures for all test modules.
"""
import pytest
import os
from app import create_app
from app.extensions import db
from app.models import User, Wallet
from datetime import datetime

os.environ['TESTING'] = '1'
os.environ['DATABASE_URL'] = os.environ.get('DATABASE_URL', 'sqlite:///:memory:')


@pytest.fixture(scope='session')
def app():
    """Create application instance for testing"""
    app = create_app()
    app.config.update({
        'TESTING': True,
        'WTF_CSRF_ENABLED': False,
        'SQLALCHEMY_DATABASE_URI': os.environ.get('DATABASE_URL'),
    })
    
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Test client for making HTTP requests"""
    return app.test_client()


@pytest.fixture
def runner(app):
    """Test CLI runner"""
    return app.test_cli_runner()


@pytest.fixture
def test_user(app):
    """Create a test user with wallet"""
    with app.app_context():
        user = User(
            username='testuser',
            email='test@example.com',
            university='Test University',
            phone='+1234567890'
        )
        user.set_password('TestPass123!')
        user.set_pin('1234')
        db.session.add(user)
        db.session.flush()
        
        wallet = Wallet(user_id=user.id, balance=1000.00)
        db.session.add(wallet)
        db.session.commit()
        
        yield user
        
        db.session.delete(user)
        try:
            db.session.commit()
        except:
            db.session.rollback()


@pytest.fixture
def test_user2(app):
    """Create a second test user for transfer tests"""
    with app.app_context():
        user = User(
            username='testuser2',
            email='test2@example.com',
            university='Test University'
        )
        user.set_password('TestPass123!')
        user.set_pin('4321')
        db.session.add(user)
        db.session.flush()
        
        wallet = Wallet(user_id=user.id, balance=500.00)
        db.session.add(wallet)
        db.session.commit()
        
        yield user
        
        db.session.delete(user)
        try:
            db.session.commit()
        except:
            db.session.rollback()


@pytest.fixture
def auth_token(client, test_user):
    """Get authentication token for test user"""
    response = client.post('/api/auth/login', json={
        'email': test_user.email,
        'password': 'TestPass123!'
    })
    return response.json.get('access_token')


@pytest.fixture
def auth_headers(auth_token):
    """Get authentication headers with Bearer token"""
    return {'Authorization': f'Bearer {auth_token}'}


class AuthenticatedClient:
    """Wrapper for test client with authentication"""
    def __init__(self, client, token):
        self.client = client
        self.token = token
    
    def get(self, url, **kwargs):
        if 'headers' not in kwargs:
            kwargs['headers'] = {}
        kwargs['headers']['Authorization'] = f'Bearer {self.token}'
        return self.client.get(url, **kwargs)
    
    def post(self, url, **kwargs):
        if 'headers' not in kwargs:
            kwargs['headers'] = {}
        kwargs['headers']['Authorization'] = f'Bearer {self.token}'
        return self.client.post(url, **kwargs)
    
    def put(self, url, **kwargs):
        if 'headers' not in kwargs:
            kwargs['headers'] = {}
        kwargs['headers']['Authorization'] = f'Bearer {self.token}'
        return self.client.put(url, **kwargs)
    
    def delete(self, url, **kwargs):
        if 'headers' not in kwargs:
            kwargs['headers'] = {}
        kwargs['headers']['Authorization'] = f'Bearer {self.token}'
        return self.client.delete(url, **kwargs)


@pytest.fixture
def auth_client(client, auth_token):
    """Authenticated test client"""
    return AuthenticatedClient(client, auth_token)

import os
from datetime import timedelta

<<<<<<< HEAD
=======
def _build_cors_origins():
    """Build CORS origins list including Replit domain if available"""
    origins = [
        'http://localhost:5000',
        'http://0.0.0.0:5000',
        'http://localhost:5001',
        'http://0.0.0.0:5001'
    ]
    
    # Add Replit domain if available
    replit_domain = os.environ.get('REPLIT_DEV_DOMAIN')
    if replit_domain:
        origins.extend([
            f'https://{replit_domain}',
            f'http://{replit_domain}'
        ])
    
    return origins

>>>>>>> org/main
class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///unipay.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
    }
    
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key-change-in-production'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
<<<<<<< HEAD
    CORS_ORIGINS = ['http://localhost:5000', 'http://0.0.0.0:5000', 'http://localhost:5001', 'http://0.0.0.0:5001']
    
    SOCKETIO_CORS_ALLOWED_ORIGINS = '*'
=======
    # CORS configuration - dynamically includes Replit domain
    CORS_ORIGINS = _build_cors_origins()
    
    # Restrict SocketIO CORS to same origins for security
    SOCKETIO_CORS_ALLOWED_ORIGINS = _build_cors_origins()
>>>>>>> org/main
    
    MAIL_SERVER = os.environ.get('MAIL_SERVER')
    MAIL_PORT = int(os.environ.get('MAIL_PORT') or 587)
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'true').lower() in ['true', 'on', '1']
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    
    UPLOAD_FOLDER = 'uploads'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024

class DevelopmentConfig(Config):
    DEBUG = True
    TESTING = False

class ProductionConfig(Config):
    DEBUG = False
    TESTING = False

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///test.db'

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

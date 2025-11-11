from flask import Flask, request, jsonify
from config import config
from app.extensions import db, jwt, socketio, cors, migrate, limiter
import logging
from logging.handlers import RotatingFileHandler
import os

def create_app(config_name='development'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, origins=app.config['CORS_ORIGINS'])
    socketio.init_app(app)
    migrate.init_app(app, db)
    
    # Initialize rate limiter
    limiter.init_app(app)
    
    # Configure logging
    if not app.debug and not app.testing:
        if not os.path.exists('logs'):
            os.mkdir('logs')
        
        file_handler = RotatingFileHandler(
            'logs/unipay.log',
            maxBytes=10240000,  # 10MB
            backupCount=10
        )
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        ))
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)
        app.logger.setLevel(logging.INFO)
        app.logger.info('UniPay startup')
    
    # Error handlers
    @app.errorhandler(Exception)
    def handle_exception(e):
        """Handle unhandled exceptions"""
        app.logger.error(f'Unhandled exception: {str(e)}', exc_info=True)
        # Don't expose internal errors in production
        if app.debug:
            return jsonify({'error': 'Internal server error', 'message': str(e)}), 500
        return jsonify({'error': 'Internal server error'}), 500
    
    @app.errorhandler(404)
    def not_found(e):
        """Handle 404 errors"""
        app.logger.warning(f'404 error: {request.url}')
        return jsonify({'error': 'Not found'}), 404
    
    @app.errorhandler(400)
    def bad_request(e):
        """Handle 400 errors"""
        app.logger.warning(f'400 error: {str(e)}')
        return jsonify({'error': 'Bad request', 'message': str(e)}), 400
    
    @app.errorhandler(429)
    def ratelimit_handler(e):
        """Handle rate limit errors"""
        app.logger.warning(f'Rate limit exceeded: {request.remote_addr} - {request.path}')
        return jsonify({
            'error': 'Too many requests',
            'message': 'Rate limit exceeded. Please try again later.'
        }), 429
    
    # Request/response logging
    @app.before_request
    def log_request():
        """Log all incoming requests"""
        if not app.testing:
            app.logger.info(f'{request.method} {request.path} - {request.remote_addr}')
    
    @app.after_request
    def log_response(response):
        """Log all responses"""
        if not app.testing:
            app.logger.info(f'{request.method} {request.path} - {response.status_code}')
        return response
    
    with app.app_context():
        from app import models
    
    from app.blueprints.auth import auth_bp
    from app.blueprints.wallet import wallet_bp
    from app.blueprints.transactions import transactions_bp
    from app.blueprints.cards import cards_bp
    from app.blueprints.savings import savings_bp
    from app.blueprints.marketplace import marketplace_bp
    from app.blueprints.loans import loans_bp
    from app.blueprints.subscriptions import subscriptions_bp
    from app.blueprints.isic import isic_bp
    from app.blueprints.isic_upload import isic_upload_bp
    from app.blueprints.expected_payments import expected_payments_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(wallet_bp, url_prefix='/api/wallet')
    app.register_blueprint(transactions_bp, url_prefix='/api/transactions')
    app.register_blueprint(cards_bp, url_prefix='/api/cards')
    app.register_blueprint(savings_bp, url_prefix='/api/savings')
    app.register_blueprint(marketplace_bp, url_prefix='/api/marketplace')
    app.register_blueprint(loans_bp, url_prefix='/api/loans')
    app.register_blueprint(subscriptions_bp, url_prefix='/api/subscriptions')
    app.register_blueprint(isic_bp, url_prefix='/api/isic')
    app.register_blueprint(isic_upload_bp)
    app.register_blueprint(expected_payments_bp, url_prefix='/api/expected-payments')
    
    @app.route('/api/health')
    def health_check():
        return {'status': 'ok', 'message': 'UniPay API is running'}
    
    return app

from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
from flask_cors import CORS
from flask_migrate import Migrate
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

db = SQLAlchemy()
jwt = JWTManager()
socketio = SocketIO(cors_allowed_origins='*')
cors = CORS()
migrate = Migrate()

# Rate limiter - initialized with app in create_app()
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["1000 per day", "100 per hour"],
    storage_uri="memory://"  # Will be configured to Redis in production
)

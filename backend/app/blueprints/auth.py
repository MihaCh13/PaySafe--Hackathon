from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from app.extensions import db, limiter
from app.models import User, Wallet
from app.utils.validators import RegisterSchema, LoginSchema, sanitize_html, validate_base64_image
from marshmallow import ValidationError

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
@limiter.limit("3 per minute")  # Prevent spam registration
def register():
    data = request.get_json()
    
    # Validate input using Marshmallow schema
    try:
        schema = RegisterSchema()
        validated_data = schema.load(data)
    except ValidationError as e:
        current_app.logger.warning(f"Registration validation failed: {e.messages}")
        return jsonify({'error': 'Validation failed', 'details': e.messages}), 400
    
    # Sanitize text inputs (but NOT password or PIN)
    email = validated_data['email'].lower().strip()
    username = sanitize_html(validated_data['username'].strip())
    
    if User.query.filter_by(email=email).first():
        current_app.logger.warning(f"Registration attempt with already registered email: {email}")
        return jsonify({'error': 'Email already registered'}), 400
    
    if User.query.filter_by(username=username).first():
        current_app.logger.warning(f"Registration attempt with already taken username: {username}")
        return jsonify({'error': 'Username already taken'}), 400
    
    # Sanitize optional text fields
    phone = sanitize_html(validated_data.get('phone', '')) if validated_data.get('phone') else None
    first_name = sanitize_html(validated_data.get('first_name', '')) if validated_data.get('first_name') else None
    last_name = sanitize_html(validated_data.get('last_name', '')) if validated_data.get('last_name') else None
    university = sanitize_html(validated_data.get('university', '')) if validated_data.get('university') else None
    faculty = sanitize_html(validated_data.get('faculty', '')) if validated_data.get('faculty') else None
    
    user = User(  # type: ignore
        email=email,
        username=username,
        phone=phone,
        first_name=first_name,
        last_name=last_name,
        university=university,
        faculty=faculty
    )
    # Password and PIN are NOT sanitized - they're hashed
    user.set_password(validated_data['password'])
    user.set_pin(validated_data['pin'])
    
    db.session.add(user)
    db.session.flush()
    
    wallet = Wallet(user_id=user.id)  # type: ignore
    db.session.add(wallet)
    
    db.session.commit()
    
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))
    
    return jsonify({
        'message': 'User registered successfully',
        'user': user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token
    }), 201

@auth_bp.route('/login', methods=['POST'])
@limiter.limit("5 per minute")  # Prevent brute force attacks
def login():
    data = request.get_json()
    
    # Validate input using Marshmallow schema
    try:
        schema = LoginSchema()
        validated_data = schema.load(data)
    except ValidationError as e:
        current_app.logger.warning(f"Login validation failed: {e.messages}")
        return jsonify({'error': 'Validation failed', 'details': e.messages}), 400
    
    email = validated_data['email'].lower().strip()
    
    user = User.query.filter_by(email=email).first()
    
    if not user:
        current_app.logger.warning(f"Login attempt for non-existent user: {email}")
        return jsonify({'error': 'Invalid email or password'}), 401

    if not user.check_password(validated_data['password']):
        current_app.logger.warning(f"Failed login attempt with invalid password for user: {email}")
        return jsonify({'error': 'Invalid email or password'}), 401
    
    if not user.is_active:
        current_app.logger.warning(f"Login attempt for deactivated account: {email}")
        return jsonify({'error': 'Account is deactivated'}), 403
    
    current_app.logger.info(f"Successful login for user: {user.email}")
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))
    
    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({'user': user.to_dict()}), 200

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_user_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    if 'email' in data and data['email'] != user.email:
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({'error': 'Email already in use'}), 400
        user.email = data['email']
    
    if 'first_name' in data:
        user.first_name = data['first_name']
    
    if 'last_name' in data:
        user.last_name = data['last_name']
    
    if 'phone' in data:
        user.phone = data['phone']
    
    if 'university' in data:
        user.university = data['university']
    
    if 'faculty' in data:
        user.faculty = data['faculty']
    
    db.session.commit()
    current_app.logger.info(f"Profile updated for user: {user.email}")
    
    return jsonify({
        'message': 'Profile updated successfully',
        'user': user.to_dict()
    }), 200

@auth_bp.route('/profile/photo', methods=['POST'])
@jwt_required()
def upload_profile_photo():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    photo_base64 = data.get('photo')
    
    if not photo_base64:
        return jsonify({'error': 'No photo provided'}), 400
    
    if not photo_base64.startswith('data:image'):
        photo_base64 = f"data:image/png;base64,{photo_base64}"
    
    is_valid, error_msg = validate_base64_image(photo_base64)
    if not is_valid:
        current_app.logger.warning(f"Invalid profile photo for user {user_id}: {error_msg}")
        return jsonify({'error': f'Invalid photo: {error_msg}'}), 400
    
    user.profile_photo_url = photo_base64
    db.session.commit()
    
    current_app.logger.info(f"Profile photo updated for user: {user.email}")
    
    return jsonify({
        'message': 'Profile photo updated successfully',
        'user': user.to_dict()
    }), 200

@auth_bp.route('/profile/photo', methods=['DELETE'])
@jwt_required()
def delete_profile_photo():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    user.profile_photo_url = None
    db.session.commit()
    
    current_app.logger.info(f"Profile photo deleted for user: {user.email}")
    
    return jsonify({
        'message': 'Profile photo deleted successfully',
        'user': user.to_dict()
    }), 200

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if user:
        current_app.logger.info(f"User logged out: {user.email}")
    
    return jsonify({'message': 'Logged out successfully'}), 200

@auth_bp.route('/set-pin', methods=['POST'])
@jwt_required()
def set_pin():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if user.pin_hash is not None:
        current_app.logger.warning(f"Attempt to use deprecated set-pin endpoint for existing PIN: {user.email}")
        return jsonify({
            'error': 'PIN already set. Use /auth/change-pin to update your PIN.',
            'requires_password': True
        }), 403
    
    data = request.get_json()
    pin = data.get('pin')
    
    if not pin or len(str(pin)) != 4 or not str(pin).isdigit():
        return jsonify({'error': 'PIN must be exactly 4 digits'}), 400
    
    user.set_pin(pin)
    db.session.commit()
    
    current_app.logger.info(f"Initial PIN set for user: {user.email}")
    return jsonify({'message': 'PIN set successfully'}), 200

@auth_bp.route('/verify-pin', methods=['POST'])
@jwt_required()
def verify_pin():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    pin = data.get('pin')
    
    if user.check_pin(pin):
        return jsonify({'valid': True}), 200
    else:
        return jsonify({'valid': False}), 400

@auth_bp.route('/change-pin', methods=['POST'])
@jwt_required()
def change_pin():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    current_password = data.get('password')
    new_pin = data.get('new_pin')
    confirm_pin = data.get('confirm_pin')
    
    if not current_password:
        return jsonify({'error': 'Current password is required'}), 400
    
    if not user.check_password(current_password):
        current_app.logger.warning(f"Failed PIN change attempt with invalid password for user: {user.email}")
        return jsonify({'error': 'Invalid password'}), 401
    
    if not new_pin or len(str(new_pin)) != 4 or not str(new_pin).isdigit():
        return jsonify({'error': 'New PIN must be exactly 4 digits'}), 400
    
    if new_pin != confirm_pin:
        return jsonify({'error': 'PINs do not match'}), 400
    
    if new_pin == '1234':
        return jsonify({'error': 'Please choose a PIN other than the default 1234', 'is_default_pin': True}), 400
    
    user.set_pin(new_pin)
    db.session.commit()
    
    current_app.logger.info(f"PIN changed successfully for user: {user.email}")
    return jsonify({'message': 'PIN changed successfully'}), 200

@auth_bp.route('/check-default-pin', methods=['GET'])
@jwt_required()
def check_default_pin():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    has_default_pin = user.check_pin('1234')
    has_pin = user.pin_hash is not None
    
    return jsonify({
        'has_pin': has_pin,
        'is_default_pin': has_default_pin
    }), 200

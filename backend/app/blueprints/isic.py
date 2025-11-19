from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.user import User
from app.models.isic_profile import ISICProfile
from app.models.merchant import Merchant
from app.models.discount_application import DiscountApplication
from datetime import datetime, date
import hashlib

isic_bp = Blueprint('isic', __name__)

@isic_bp.route('/profile', methods=['POST'])
@jwt_required()
def link_profile():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    isic_number = data.get('isic_number')
    student_name = data.get('student_name')
    university = data.get('university')
    expiry_date_str = data.get('expiry_date')
    
    if not all([isic_number, student_name, university, expiry_date_str]):
        return jsonify({'error': 'Missing required fields'}), 400
    
    existing_profile = ISICProfile.query.filter_by(user_id=current_user_id).first()
    if existing_profile:
        return jsonify({'error': 'ISIC profile already linked'}), 400
    
    existing_isic = ISICProfile.query.filter_by(isic_number=isic_number).first()
    if existing_isic:
        return jsonify({'error': 'ISIC number already in use'}), 400
    
    try:
        expiry_date = datetime.strptime(expiry_date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    
    if expiry_date < date.today():
        return jsonify({'error': 'ISIC card has expired'}), 400
    
    qr_data = f"ISIC:{isic_number}:{student_name}:{university}"
    qr_code_data = hashlib.sha256(qr_data.encode()).hexdigest()
    
    profile = ISICProfile(  # type: ignore
        user_id=current_user_id,
        isic_number=isic_number,
        student_name=student_name,
        university=university,
        expiry_date=expiry_date,
        is_verified=True,
        qr_code_data=qr_code_data
    )
    
    db.session.add(profile)
    db.session.commit()
    
    return jsonify({
        'message': 'ISIC profile linked successfully',
        'profile': profile.to_dict()
    }), 201

@isic_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_id = get_jwt_identity()
    profile = ISICProfile.query.filter_by(user_id=current_user_id).first()
    
    if not profile:
        return jsonify({'error': 'No ISIC profile linked'}), 404
    
    return jsonify({'profile': profile.to_dict()}), 200

@isic_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    current_user_id = get_jwt_identity()
    profile = ISICProfile.query.filter_by(user_id=current_user_id).first()
    
    if not profile:
        return jsonify({'error': 'No ISIC profile linked'}), 404
    
    data = request.get_json()
    
    if 'student_name' in data:
        profile.student_name = data['student_name']
    if 'university' in data:
        profile.university = data['university']
    if 'expiry_date' in data:
        try:
            expiry_date = datetime.strptime(data['expiry_date'], '%Y-%m-%d').date()
            profile.expiry_date = expiry_date
        except ValueError:
            return jsonify({'error': 'Invalid date format'}), 400
    
    profile.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'message': 'Profile updated successfully',
        'profile': profile.to_dict()
    }), 200

@isic_bp.route('/profile', methods=['DELETE'])
@jwt_required()
def unlink_profile():
    current_user_id = get_jwt_identity()
    profile = ISICProfile.query.filter_by(user_id=current_user_id).first()
    
    if not profile:
        return jsonify({'error': 'No ISIC profile linked'}), 404
    
    db.session.delete(profile)
    db.session.commit()
    
    return jsonify({'message': 'ISIC profile unlinked successfully'}), 200

@isic_bp.route('/merchants', methods=['GET'])
def get_merchants():
    category = request.args.get('category')
    
    query = Merchant.query.filter_by(is_active=True)
    
    if category:
        query = query.filter_by(category=category)
    
    merchants = query.all()
    
    return jsonify({
        'merchants': [merchant.to_dict() for merchant in merchants],
        'count': len(merchants)
    }), 200

@isic_bp.route('/merchants/<int:merchant_id>', methods=['GET'])
def get_merchant(merchant_id):
    merchant = Merchant.query.get(merchant_id)
    
    if not merchant:
        return jsonify({'error': 'Merchant not found'}), 404
    
    return jsonify({'merchant': merchant.to_dict()}), 200

@isic_bp.route('/merchants/detect-online', methods=['POST'])
@jwt_required()
def detect_online_merchant():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    url = data.get('url', '')
    domain = data.get('domain', '')
    
    if not url and not domain:
        return jsonify({'error': 'URL or domain required'}), 400
    
    profile = ISICProfile.query.filter_by(user_id=current_user_id).first()
    if not profile:
        return jsonify({'has_discount': False, 'reason': 'No ISIC profile linked'}), 200
    
    if profile.is_expired():
        return jsonify({'has_discount': False, 'reason': 'ISIC card expired'}), 200
    
    if domain:
        merchant = Merchant.query.filter_by(online_domain=domain, is_active=True).first()
    else:
        for merchant in Merchant.query.filter_by(is_active=True).all():
            if merchant.online_domain and merchant.online_domain in url:
                break
        else:
            merchant = None
    
    if not merchant:
        return jsonify({'has_discount': False, 'reason': 'Merchant not found'}), 200
    
    return jsonify({
        'has_discount': True,
        'merchant': merchant.to_dict(),
        'profile': profile.to_dict()
    }), 200

@isic_bp.route('/merchants/detect-physical', methods=['POST'])
@jwt_required()
def detect_physical_merchant():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    merchant_id = data.get('merchant_id')
    merchant_name = data.get('merchant_name')
    
    if not merchant_id and not merchant_name:
        return jsonify({'error': 'Merchant ID or name required'}), 400
    
    profile = ISICProfile.query.filter_by(user_id=current_user_id).first()
    if not profile:
        return jsonify({'has_discount': False, 'reason': 'No ISIC profile linked'}), 200
    
    if profile.is_expired():
        return jsonify({'has_discount': False, 'reason': 'ISIC card expired'}), 200
    
    if merchant_id:
        merchant = Merchant.query.filter_by(pos_merchant_id=merchant_id, is_active=True).first()
    else:
        merchant = Merchant.query.filter_by(name=merchant_name, is_active=True).first()
    
    if not merchant:
        return jsonify({'has_discount': False, 'reason': 'Merchant not found'}), 200
    
    return jsonify({
        'has_discount': True,
        'merchant': merchant.to_dict(),
        'profile': profile.to_dict(),
        'should_block_payment': True
    }), 200

@isic_bp.route('/discounts/check', methods=['POST'])
@jwt_required()
def check_discount():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    merchant_id = data.get('merchant_id')
    amount = data.get('amount')
    
    if not merchant_id or not amount:
        return jsonify({'error': 'Merchant ID and amount required'}), 400
    
    profile = ISICProfile.query.filter_by(user_id=current_user_id).first()
    if not profile or profile.is_expired():
        return jsonify({'eligible': False}), 200
    
    merchant = Merchant.query.get(merchant_id)
    if not merchant or not merchant.is_active:
        return jsonify({'eligible': False}), 200
    
    discount_amount = float(amount) * (merchant.discount_percentage / 100)
    final_amount = float(amount) - discount_amount
    
    return jsonify({
        'eligible': True,
        'original_amount': float(amount),
        'discount_percentage': merchant.discount_percentage,
        'discount_amount': round(discount_amount, 2),
        'final_amount': round(final_amount, 2),
        'merchant': merchant.to_dict()
    }), 200

@isic_bp.route('/discounts/apply', methods=['POST'])
@jwt_required()
def apply_discount():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    merchant_id = data.get('merchant_id')
    amount = data.get('amount')
    detection_method = data.get('detection_method', 'online')
    transaction_id = data.get('transaction_id')
    
    if not merchant_id or not amount:
        return jsonify({'error': 'Merchant ID and amount required'}), 400
    
    profile = ISICProfile.query.filter_by(user_id=current_user_id).first()
    if not profile or profile.is_expired():
        return jsonify({'error': 'Invalid or expired ISIC profile'}), 400
    
    merchant = Merchant.query.get(merchant_id)
    if not merchant or not merchant.is_active:
        return jsonify({'error': 'Invalid merchant'}), 400
    
    discount_amount = float(amount) * (merchant.discount_percentage / 100)
    final_amount = float(amount) - discount_amount
    
    application = DiscountApplication(  # type: ignore
        isic_profile_id=profile.id,
        merchant_id=merchant_id,
        transaction_id=transaction_id,
        original_amount=amount,
        discount_amount=discount_amount,
        final_amount=final_amount,
        detection_method=detection_method
    )
    
    db.session.add(application)
    db.session.commit()
    
    return jsonify({
        'message': 'Discount applied successfully',
        'application': application.to_dict()
    }), 201

@isic_bp.route('/discounts/history', methods=['GET'])
@jwt_required()
def get_discount_history():
    current_user_id = get_jwt_identity()
    profile = ISICProfile.query.filter_by(user_id=current_user_id).first()
    
    if not profile:
        return jsonify({'applications': [], 'total_savings': 0}), 200
    
    applications = DiscountApplication.query.filter_by(isic_profile_id=profile.id).order_by(DiscountApplication.applied_at.desc()).all()
    
    total_savings = sum(float(app.discount_amount) for app in applications)
    
    return jsonify({
        'applications': [app.to_dict() for app in applications],
        'total_savings': round(total_savings, 2),
        'count': len(applications)
    }), 200

@isic_bp.route('/discounts/savings', methods=['GET'])
@jwt_required()
def get_savings_stats():
    current_user_id = get_jwt_identity()
    profile = ISICProfile.query.filter_by(user_id=current_user_id).first()
    
    if not profile:
        return jsonify({'total_savings': 0, 'discount_count': 0}), 200
    
    applications = DiscountApplication.query.filter_by(isic_profile_id=profile.id).all()
    
    total_savings = sum(float(app.discount_amount) for app in applications)
    online_count = len([app for app in applications if app.detection_method == 'online'])
    physical_count = len([app for app in applications if app.detection_method == 'physical'])
    
    return jsonify({
        'total_savings': round(total_savings, 2),
        'discount_count': len(applications),
        'online_discounts': online_count,
        'physical_discounts': physical_count
    }), 200

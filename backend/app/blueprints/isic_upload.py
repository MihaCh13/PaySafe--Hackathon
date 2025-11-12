import base64
import io
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.virtual_card import VirtualCard
from app.models.isic_card_metadata import ISICCardMetadata
from app.models.isic_profile import ISICProfile
from app.utils.validators import validate_base64_image, sanitize_html

isic_upload_bp = Blueprint('isic_upload', __name__, url_prefix='/api/isic')

@isic_upload_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_card_metadata():
    """Upload ISIC card metadata with optional screenshot"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    virtual_card_id = data.get('virtualCardId')
    card_data = data.get('cardData')
    upload_screenshot = data.get('uploadScreenshot', False)
    screenshot_base64 = data.get('screenshotBase64')
    
    if not card_data:
        return jsonify({'error': 'Card data is required'}), 400
    
    # Convert empty string to None for database NULL
    if virtual_card_id == '' or virtual_card_id is None:
        virtual_card_id = None
    
    if virtual_card_id:
        virtual_card = VirtualCard.query.filter_by(
            id=virtual_card_id,
            user_id=current_user_id
        ).first()
        
        if not virtual_card:
            return jsonify({'error': 'Virtual card not found'}), 404
        
        existing_metadata = ISICCardMetadata.query.filter_by(
            virtual_card_id=virtual_card_id
        ).first()
        
        if existing_metadata:
            return jsonify({'error': 'Card already has ISIC metadata'}), 409
    
    try:
        isic_profile = ISICProfile.query.filter_by(user_id=current_user_id).first()
        isic_profile_id = isic_profile.id if isic_profile else None
        
        card_number = card_data.get('cardNumber')
        full_name = card_data.get('fullName')
        date_of_birth_str = card_data.get('dateOfBirth')
        expiry_date_str = card_data.get('expiryDate')
        institution = card_data.get('institution')
        card_type = card_data.get('cardType', 'physical')
        
        date_of_birth = datetime.fromisoformat(date_of_birth_str).date() if date_of_birth_str else None
        expiry_date = datetime.fromisoformat(expiry_date_str).date() if expiry_date_str else None
        
        screenshot_url = None
        if upload_screenshot and screenshot_base64:
            # Validate screenshot base64
            if not screenshot_base64.startswith('data:image'):
                screenshot_base64 = f"data:image/png;base64,{screenshot_base64}"
            
            is_valid, error_msg = validate_base64_image(screenshot_base64)
            if not is_valid:
                current_app.logger.warning(f"Invalid ISIC screenshot for user {current_user_id}: {error_msg}")
                return jsonify({'error': f'Invalid screenshot: {error_msg}'}), 400
            
            screenshot_url = screenshot_base64
            current_app.logger.info(f"Screenshot validated and saved for user {current_user_id}")
        
        existing_user_metadata = ISICCardMetadata.query.filter_by(
            user_id=current_user_id
        ).first()
        
        if existing_user_metadata:
            existing_user_metadata.card_number = card_number
            existing_user_metadata.full_name = full_name
            existing_user_metadata.date_of_birth = date_of_birth
            existing_user_metadata.expiry_date = expiry_date
            existing_user_metadata.institution = institution
            existing_user_metadata.card_type = card_type
            if screenshot_url:
                existing_user_metadata.screenshot_url = screenshot_url
            existing_user_metadata.updated_at = datetime.utcnow()
            metadata = existing_user_metadata
            print(f"Updated existing metadata for user {current_user_id}")
        else:
            metadata = ISICCardMetadata(
                user_id=current_user_id,
                virtual_card_id=virtual_card_id,
                isic_profile_id=isic_profile_id,
                card_number=card_number,
                full_name=full_name,
                date_of_birth=date_of_birth,
                expiry_date=expiry_date,
                institution=institution,
                card_type=card_type,
                screenshot_url=screenshot_url,
                verification_status='verified'
            )
            db.session.add(metadata)
            print(f"Created new metadata for user {current_user_id}")
        
        if isic_profile and card_number and full_name:
            isic_profile.isic_number = card_number
            isic_profile.student_name = full_name
            if institution:
                isic_profile.university = institution
            if expiry_date:
                isic_profile.expiry_date = expiry_date
            print(f"Updated ISIC profile {isic_profile.id} with uploaded data")
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': metadata.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error uploading card metadata: {e}")
        return jsonify({'error': 'Failed to save card metadata'}), 500

@isic_upload_bp.route('/metadata', methods=['GET'])
@jwt_required()
def get_user_card_metadata():
    """Get ISIC metadata for current user"""
    current_user_id = get_jwt_identity()
    
    metadata = ISICCardMetadata.query.filter_by(
        user_id=current_user_id
    ).first()
    
    if not metadata:
        return jsonify({'error': 'No ISIC metadata found'}), 404
    
    metadata_dict = metadata.to_dict(include_screenshot=True)
    
    if metadata.screenshot_url:
        metadata_dict['screenshot_base64'] = metadata.screenshot_url
    
    return jsonify({
        'success': True,
        'data': metadata_dict
    }), 200

@isic_upload_bp.route('/metadata/<int:card_id>', methods=['GET'])
@jwt_required()
def get_card_metadata(card_id):
    """Get ISIC metadata for a virtual card"""
    current_user_id = get_jwt_identity()
    
    virtual_card = VirtualCard.query.filter_by(
        id=card_id,
        user_id=current_user_id
    ).first()
    
    if not virtual_card:
        return jsonify({'error': 'Virtual card not found'}), 404
    
    metadata = ISICCardMetadata.query.filter_by(
        virtual_card_id=card_id
    ).first()
    
    if not metadata:
        return jsonify({'error': 'No ISIC metadata found'}), 404
    
    return jsonify({
        'success': True,
        'data': metadata.to_dict(include_screenshot=True)
    }), 200

@isic_upload_bp.route('/metadata/<int:metadata_id>', methods=['PATCH'])
@jwt_required()
def update_card_metadata(metadata_id):
    """Update ISIC card metadata"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    metadata = ISICCardMetadata.query.filter_by(
        id=metadata_id,
        user_id=current_user_id
    ).first()
    
    if not metadata:
        return jsonify({'error': 'Metadata not found'}), 404
    
    try:
        if 'cardNumber' in data:
            metadata.card_number = data['cardNumber']
        if 'fullName' in data:
            metadata.full_name = data['fullName']
        if 'dateOfBirth' in data:
            metadata.date_of_birth = datetime.fromisoformat(data['dateOfBirth']).date()
        if 'expiryDate' in data:
            metadata.expiry_date = datetime.fromisoformat(data['expiryDate']).date()
        if 'institution' in data:
            metadata.institution = data['institution']
        if 'cardType' in data:
            metadata.card_type = data['cardType']
        
        metadata.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': metadata.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error updating card metadata: {e}")
        return jsonify({'error': 'Failed to update card metadata'}), 500

@isic_upload_bp.route('/metadata/<int:metadata_id>', methods=['DELETE'])
@jwt_required()
def delete_card_metadata(metadata_id):
    """Delete ISIC card metadata"""
    current_user_id = get_jwt_identity()
    
    metadata = ISICCardMetadata.query.filter_by(
        id=metadata_id,
        user_id=current_user_id
    ).first()
    
    if not metadata:
        return jsonify({'error': 'Metadata not found'}), 404
    
    try:
        db.session.delete(metadata)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'ISIC card metadata deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting card metadata: {e}")
        return jsonify({'error': 'Failed to delete card metadata'}), 500

@isic_upload_bp.route('/verify/<int:metadata_id>', methods=['POST'])
@jwt_required()
def verify_card_metadata(metadata_id):
    """Admin endpoint to verify ISIC card"""
    current_user_id = get_jwt_identity()
    
    user = User.query.get(current_user_id)
    if not user or not getattr(user, 'is_admin', False):
        return jsonify({'error': 'Unauthorized'}), 403
    
    metadata = ISICCardMetadata.query.get(metadata_id)
    
    if not metadata:
        return jsonify({'error': 'Metadata not found'}), 404
    
    data = request.get_json()
    status = data.get('status', 'verified')
    
    if status not in ['verified', 'rejected']:
        return jsonify({'error': 'Invalid status'}), 400
    
    try:
        metadata.verification_status = status
        metadata.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': metadata.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error verifying card metadata: {e}")
        return jsonify({'error': 'Failed to verify card metadata'}), 500

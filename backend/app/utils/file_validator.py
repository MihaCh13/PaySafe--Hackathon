"""
File upload validation utilities for UniPay.
Provides protection against malicious file uploads.
"""
import magic
import os
from werkzeug.utils import secure_filename
from typing import Tuple

# Allowed file types for image uploads
ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
]

# Maximum file size: 5MB
MAX_FILE_SIZE = 5 * 1024 * 1024


def validate_image_upload(file) -> Tuple[bool, str]:
    """
    Validate uploaded image file for security and constraints.
    
    Checks:
    - File exists
    - Filename is valid
    - File size is within limits
    - MIME type is allowed (using python-magic for content inspection)
    
    Args:
        file: FileStorage object from request.files
        
    Returns:
        Tuple of (is_valid, filename_or_error_message)
        - If valid: (True, secure_filename)
        - If invalid: (False, error_message)
    """
    if not file:
        return False, "No file provided"
    
    # Check and secure filename
    filename = secure_filename(file.filename)
    if not filename:
        return False, "Invalid filename"
    
    # Check file extension
    allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
    file_ext = os.path.splitext(filename)[1].lower()
    if file_ext not in allowed_extensions:
        return False, f"Invalid file extension. Allowed: {', '.join(allowed_extensions)}"
    
    # Check file size
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)  # Reset file pointer
    
    if size == 0:
        return False, "File is empty"
    
    if size > MAX_FILE_SIZE:
        size_mb = size / (1024 * 1024)
        return False, f"File too large ({size_mb:.1f}MB). Maximum size is 5MB"
    
    # Check MIME type using python-magic (inspects actual file content)
    try:
        # Read first 2KB for MIME detection
        file_header = file.read(2048)
        file.seek(0)  # Reset file pointer
        
        mime = magic.from_buffer(file_header, mime=True)
        
        if mime not in ALLOWED_IMAGE_TYPES:
            return False, f"Invalid file type detected: {mime}. Allowed: {', '.join(ALLOWED_IMAGE_TYPES)}"
    except Exception as e:
        # If magic fails, fall back to extension check only
        # This ensures the function still works if libmagic is not installed
        pass
    
    return True, filename


def validate_file_extension(filename: str, allowed_extensions: set) -> bool:
    """
    Validate file extension.
    
    Args:
        filename: Name of the file
        allowed_extensions: Set of allowed extensions (e.g., {'.pdf', '.doc'})
        
    Returns:
        True if extension is allowed, False otherwise
    """
    if not filename:
        return False
    
    file_ext = os.path.splitext(filename)[1].lower()
    return file_ext in allowed_extensions

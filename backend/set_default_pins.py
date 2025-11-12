"""
Set Default PIN Migration Script

This script sets a default PIN '1234' for all existing users who don't have a PIN.
This is useful for migrating existing user accounts to support the PIN feature.

Usage:
    python backend/set_default_pins.py

The script will:
- Find all users without a PIN
- Set their PIN to '1234' (default)
- Report how many users were updated
- Roll back changes if any error occurs
"""

from app import create_app
from app.extensions import db
from app.models.user import User

def set_default_pins():
    app = create_app()
    
    with app.app_context():
        try:
            users_without_pin = User.query.filter(User.pin_hash == None).all()
            
            if not users_without_pin:
                print("✅ All users already have a PIN set!")
                return
            
            print(f"Found {len(users_without_pin)} users without a PIN")
            print("Setting default PIN '1234' for these users...\n")
            
            updated_count = 0
            for user in users_without_pin:
                print(f"  Setting PIN for: {user.email} ({user.username})")
                user.set_pin('1234')
                updated_count += 1
            
            db.session.commit()
            
            print(f"\n🎉 Successfully set default PIN for {updated_count} users!")
            print("\n" + "="*60)
            print("💡 All users now have default PIN: 1234")
            print("   Users should change their PIN from Profile > Security settings")
            print("="*60)
            
        except Exception as e:
            db.session.rollback()
            print(f"\n❌ Error setting default PINs: {str(e)}")
            raise

if __name__ == '__main__':
    set_default_pins()

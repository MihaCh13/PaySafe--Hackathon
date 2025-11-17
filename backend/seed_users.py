"""
Test User Seeder Script

This script creates or updates test users with known credentials for development and testing.

Usage:
    python backend/seed_users.py

Test Credentials:
    - Email: admin@test.com     | Password: admin123 | PIN: 1234
    - Email: student@test.com   | Password: student123 | PIN: 1234
    - Email: demo@test.com      | Password: demo123 | PIN: 1234

The script will:
- Create new users if they don't exist
- Update passwords and PINs for existing users with matching email/username
- Set default PIN '1234' for all test users
- Create a wallet for each new user
- Roll back changes if any error occurs
"""

from app import create_app  # type: ignore
from app.extensions import db
from app.models.user import User
from app.models.wallet import Wallet

def seed_test_users():
    app = create_app()
    
    with app.app_context():
        test_users = [
            {
                'email': 'admin@test.com',
                'username': 'admin',
                'password': 'admin123',
                'first_name': 'Admin',
                'last_name': 'User',
                'university': 'Test University',
                'faculty': 'Computer Science'
            },
            {
                'email': 'student@test.com',
                'username': 'student',
                'password': 'student123',
                'first_name': 'Test',
                'last_name': 'Student',
                'university': 'Test University',
                'faculty': 'Engineering'
            },
            {
                'email': 'demo@test.com',
                'username': 'demo',
                'password': 'demo123',
                'first_name': 'Demo',
                'last_name': 'User',
                'university': 'Demo University',
                'faculty': 'Business'
            }
        ]
        
        created_count = 0
        updated_count = 0
        
        try:
            for user_data in test_users:
                password = user_data.pop('password')
                existing_user = User.query.filter(
                    (User.email == user_data['email']) | (User.username == user_data['username'])
                ).first()
                
                if existing_user:
                    print(f"⚠️  Found existing user (ID: {existing_user.id}, email: {existing_user.email}, username: {existing_user.username})")
                    print(f"    Updating to: {user_data['email']} / {user_data['username']}")
                    
                    for key, value in user_data.items():
                        setattr(existing_user, key, value)
                    existing_user.set_password(password)
                    existing_user.set_pin('1234')
                    updated_count += 1
                    print(f"✅ User updated: {user_data['email']} with PIN: 1234")
                else:
                    user = User(**user_data)
                    user.set_password(password)
                    user.set_pin('1234')
                    db.session.add(user)
                    db.session.flush()
                    
                    wallet = Wallet(user_id=user.id)  # type: ignore
                    db.session.add(wallet)
                    
                    created_count += 1
                    print(f"✅ Created user: {user.email} with password: {password} and PIN: 1234")
            
            db.session.commit()
            
            if created_count > 0:
                print(f"\n🎉 Successfully created {created_count} test users!")
            if updated_count > 0:
                print(f"🔄 Successfully updated passwords for {updated_count} existing users!")
            
            print("\n" + "="*60)
            print("TEST CREDENTIALS:")
            print("="*60)
            print("1. Email: admin@test.com     | Password: admin123 | PIN: 1234")
            print("2. Email: student@test.com   | Password: student123 | PIN: 1234")
            print("3. Email: demo@test.com      | Password: demo123 | PIN: 1234")
            print("="*60)
            print("\n💡 All users have default PIN: 1234")
            print("   Users should change their PIN from Profile > Security settings")
            print("="*60)
            
        except Exception as e:
            db.session.rollback()
            print(f"\n❌ Error seeding users: {str(e)}")
            raise

if __name__ == '__main__':
    seed_test_users()

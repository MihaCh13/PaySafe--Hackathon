"""
Extended Test User Seeder Script - Creates 16+ accounts with realistic data

This script creates the full set of test users found in historical transaction reports
to restore the populated test environment.

Usage:
    python backend/seed_extended_users.py

This will create:
- 16 user accounts matching historical data
- Wallets for each user
- Varying initial balances
"""

from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.wallet import Wallet
from decimal import Decimal

def seed_extended_users():
    app = create_app()
    
    with app.app_context():
        extended_users = [
            {
                'email': 'test@student.com',
                'username': 'testuser',
                'password': 'password123',
                'first_name': 'Test',
                'last_name': 'User',
                'university': 'Test University',
                'faculty': 'Computer Science',
                'initial_balance': Decimal('1142.35')
            },
            {
                'email': 'demo@student.com',
                'username': 'demouser',
                'password': 'password123',
                'first_name': 'Demo',
                'last_name': 'User',
                'university': 'Test University',
                'faculty': 'Engineering',
                'initial_balance': Decimal('639.28')
            },
            {
                'email': 'alice@student.com',
                'username': 'alice',
                'password': 'password123',
                'first_name': 'Alice',
                'last_name': 'Johnson',
                'university': 'Tech University',
                'faculty': 'Computer Science',
                'initial_balance': Decimal('1399.77')
            },
            {
                'email': 'bob@student.com',
                'username': 'bob',
                'password': 'password123',
                'first_name': 'Bob',
                'last_name': 'Smith',
                'university': 'State University',
                'faculty': 'Business',
                'initial_balance': Decimal('521.09')
            },
            {
                'email': 'eve@student.com',
                'username': 'eve',
                'password': 'password123',
                'first_name': 'Eve',
                'last_name': 'Williams',
                'university': 'City College',
                'faculty': 'Arts',
                'initial_balance': Decimal('1472.94')
            },
            {
                'email': 'frank@student.com',
                'username': 'frank',
                'password': 'password123',
                'first_name': 'Frank',
                'last_name': 'Brown',
                'university': 'Tech University',
                'faculty': 'Engineering',
                'initial_balance': Decimal('987.12')
            },
            {
                'email': 'misheto05@gmail.com',
                'username': 'Miha.Ch',
                'password': 'password123',
                'first_name': 'Miha',
                'last_name': 'Chavdarov',
                'university': 'Sofia University',
                'faculty': 'Computer Science',
                'initial_balance': Decimal('1288.45')
            },
            {
                'email': 'plamigeor.135@gmail.com',
                'username': 'Plampie',
                'password': 'password123',
                'first_name': 'Plamen',
                'last_name': 'Georgiev',
                'university': 'Technical University',
                'faculty': 'Engineering',
                'initial_balance': Decimal('747.81')
            },
            {
                'email': 'sami@gmail.com',
                'username': 'Sami',
                'password': 'password123',
                'first_name': 'Sami',
                'last_name': 'Hassan',
                'university': 'State University',
                'faculty': 'Medicine',
                'initial_balance': Decimal('1311.66')
            },
            {
                'email': 'plammygeor@gmail.com',
                'username': 'plampie',
                'password': 'password123',
                'first_name': 'Plamen',
                'last_name': 'Georgiev Jr',
                'university': 'Business School',
                'faculty': 'Business Administration',
                'initial_balance': Decimal('807.34')
            },
            {
                'email': 'demo2@student.com',
                'username': 'demo2',
                'password': 'password123',
                'first_name': 'Demo',
                'last_name': 'Account Two',
                'university': 'Demo University',
                'faculty': 'Computer Science',
                'initial_balance': Decimal('1433.25')
            },
            {
                'email': 'charlie@student.com',
                'username': 'charlie',
                'password': 'password123',
                'first_name': 'Charlie',
                'last_name': 'Davis',
                'university': 'Metro College',
                'faculty': 'Design',
                'initial_balance': Decimal('850.00')
            },
            {
                'email': 'diana@student.com',
                'username': 'diana',
                'password': 'password123',
                'first_name': 'Diana',
                'last_name': 'Martinez',
                'university': 'State University',
                'faculty': 'Law',
                'initial_balance': Decimal('1100.00')
            },
            {
                'email': 'george@student.com',
                'username': 'george',
                'password': 'password123',
                'first_name': 'George',
                'last_name': 'Wilson',
                'university': 'Tech Institute',
                'faculty': 'Physics',
                'initial_balance': Decimal('650.00')
            },
            {
                'email': 'helen@student.com',
                'username': 'helen',
                'password': 'password123',
                'first_name': 'Helen',
                'last_name': 'Taylor',
                'university': 'Arts College',
                'faculty': 'Music',
                'initial_balance': Decimal('920.00')
            },
            {
                'email': 'ivan@student.com',
                'username': 'ivan',
                'password': 'password123',
                'first_name': 'Ivan',
                'last_name': 'Petrov',
                'university': 'Sofia University',
                'faculty': 'Mathematics',
                'initial_balance': Decimal('1250.00')
            }
        ]
        
        created_count = 0
        updated_count = 0
        
        try:
            for user_data in extended_users:
                initial_balance = user_data.pop('initial_balance')
                password = user_data.pop('password')
                
                existing_user = User.query.filter(
                    (User.email == user_data['email']) | (User.username == user_data['username'])
                ).first()
                
                if existing_user:
                    print(f"⚠️  User already exists: {existing_user.email}")
                    for key, value in user_data.items():
                        setattr(existing_user, key, value)
                    existing_user.set_password(password)
                    existing_user.set_pin('1234')
                    
                    if existing_user.wallet:
                        existing_user.wallet.balance = initial_balance
                    
                    updated_count += 1
                else:
                    user = User(**user_data)
                    user.set_password(password)
                    user.set_pin('1234')
                    db.session.add(user)
                    db.session.flush()
                    
                    wallet = Wallet(
                        user_id=user.id,
                        balance=initial_balance,
                        currency='USD'
                    )
                    db.session.add(wallet)
                    
                    created_count += 1
                    print(f"✅ Created user: {user.email} (balance: ${initial_balance})")
            
            db.session.commit()
            
            total_users = User.query.count()
            
            print(f"\n{'='*70}")
            print(f"EXTENDED USER SEEDING COMPLETE")
            print(f"{'='*70}")
            print(f"✅ Created: {created_count} new users")
            print(f"🔄 Updated: {updated_count} existing users")
            print(f"📊 Total users in database: {total_users}")
            print(f"{'='*70}")
            print(f"\n💡 All users have:")
            print(f"   - Password: password123")
            print(f"   - PIN: 1234")
            print(f"   - Wallet with initial balance")
            print(f"{'='*70}\n")
            print(f"Next steps:")
            print(f"1. Run: python backend/generate_transaction_history.py --live")
            print(f"2. Run: python backend/generate_upcoming_payments.py")
            print(f"3. Create additional seeders for Dark Days, Marketplace, Loans, etc.")
            print(f"{'='*70}\n")
            
        except Exception as e:
            db.session.rollback()
            print(f"\n❌ Error seeding users: {str(e)}")
            raise

if __name__ == '__main__':
    seed_extended_users()

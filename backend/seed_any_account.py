"""
Flexible Account Seeder - Populate any account with comprehensive test data
Usage: python backend/seed_any_account.py <email>
Example: python backend/seed_any_account.py student@test.com
"""

import sys
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.transaction import Transaction
from app.models.virtual_card import VirtualCard
from app.models.goal import Goal
from app.models.savings_pocket import SavingsPocket
from app.models.marketplace import MarketplaceListing
from app.models.loan import Loan, LoanRepayment
from decimal import Decimal
from datetime import datetime, timedelta
import random

def seed_account(email):
    app = create_app()
    
    with app.app_context():
        print(f"\n{'='*70}")
        print(f"SEEDING ACCOUNT: {email}")
        print(f"{'='*70}\n")
        
        # Get the user
        user = User.query.filter_by(email=email).first()
        if not user:
            print(f"❌ Error: User {email} not found!")
            return
        
        print(f"✅ Found user: {user.username} ({user.email})")
        
        # Get other users
        other_users = User.query.filter(User.id != user.id).limit(10).all()
        if len(other_users) < 3:
            print("⚠️  Warning: Not enough other users. Some features may be limited.")
        
        # Clear existing data for this user
        print("\n🗑️  Clearing existing data...")
        
        # Delete loan repayments first (foreign key constraint)
        user_loans = Loan.query.filter((Loan.lender_id == user.id) | (Loan.borrower_id == user.id)).all()
        for loan in user_loans:
            LoanRepayment.query.filter_by(loan_id=loan.id).delete()
        
        # Now safe to delete loans
        Loan.query.filter((Loan.lender_id == user.id) | (Loan.borrower_id == user.id)).delete()
        
        # Delete other data
        Transaction.query.filter_by(user_id=user.id).delete()
        VirtualCard.query.filter_by(user_id=user.id).delete()
        Goal.query.filter_by(user_id=user.id).delete()
        SavingsPocket.query.filter_by(user_id=user.id).delete()
        MarketplaceListing.query.filter_by(seller_id=user.id).delete()
        
        db.session.commit()
        print("✅ Cleared existing data")
        
        # 1. TRANSFERS
        print("\n💸 Creating Transfers...")
        incoming_transfers = [
            {'from_user': other_users[0], 'amount': Decimal('150.00'), 'description': 'Rent split - September', 'days_ago': 85},
            {'from_user': other_users[1], 'amount': Decimal('75.50'), 'description': 'Dinner payment', 'days_ago': 45},
            {'from_user': other_users[2], 'amount': Decimal('200.00'), 'description': 'Concert ticket reimbursement', 'days_ago': 30},
            {'from_user': other_users[3], 'amount': Decimal('50.00'), 'description': 'Book purchase', 'days_ago': 15},
        ]
        
        for transfer in incoming_transfers:
            timestamp = datetime.utcnow() - timedelta(days=transfer['days_ago'])
            transaction = Transaction(
                user_id=user.id,
                sender_id=transfer['from_user'].id,
                receiver_id=user.id,
                transaction_type='transfer',
                amount=transfer['amount'],
                description=f"Transfer from {transfer['from_user'].username}: {transfer['description']}",
                status='completed',
                created_at=timestamp,
                completed_at=timestamp,
                transaction_metadata={'from_user': transfer['from_user'].username}
            )
            db.session.add(transaction)
        
        outgoing_transfers = [
            {'to_user': other_users[0], 'amount': Decimal('100.00'), 'description': 'Monthly subscription share', 'days_ago': 60},
            {'to_user': other_users[4], 'amount': Decimal('125.00'), 'description': 'Study materials', 'days_ago': 40},
            {'to_user': other_users[1], 'amount': Decimal('80.00'), 'description': 'Birthday gift contribution', 'days_ago': 20},
        ]
        
        for transfer in outgoing_transfers:
            timestamp = datetime.utcnow() - timedelta(days=transfer['days_ago'])
            transaction = Transaction(
                user_id=user.id,
                sender_id=user.id,
                receiver_id=transfer['to_user'].id,
                transaction_type='transfer',
                amount=-transfer['amount'],
                description=f"Transfer to {transfer['to_user'].username}: {transfer['description']}",
                status='completed',
                created_at=timestamp,
                completed_at=timestamp,
                transaction_metadata={'to_user': transfer['to_user'].username}
            )
            db.session.add(transaction)
        
        print(f"   ✅ Created {len(incoming_transfers) + len(outgoing_transfers)} transfers")
        
        # 2. BUDGET CARDS
        print("\n💳 Creating Budget Cards...")
        budget_cards_data = [
            {'card_name': 'Food & Drink', 'category': 'Food & Dining', 'icon': '🍔', 'color': '#ef4444', 'allocated_amount': Decimal('500.00'), 'spent_amount': Decimal('325.50'), 'monthly_limit': Decimal('500.00')},
            {'card_name': 'Entertainment', 'category': 'Entertainment', 'icon': '🎬', 'color': '#8b5cf6', 'allocated_amount': Decimal('200.00'), 'spent_amount': Decimal('145.00'), 'monthly_limit': Decimal('200.00')},
            {'card_name': 'Savings Card', 'category': 'Savings', 'icon': '💰', 'color': '#10b981', 'allocated_amount': Decimal('300.00'), 'spent_amount': Decimal('0.00'), 'monthly_limit': Decimal('300.00')},
            {'card_name': 'Transport', 'category': 'Transportation', 'icon': '🚗', 'color': '#3b82f6', 'allocated_amount': Decimal('150.00'), 'spent_amount': Decimal('87.25'), 'monthly_limit': Decimal('150.00')},
        ]
        
        created_cards = []
        for card_data in budget_cards_data:
            card = VirtualCard(user_id=user.id, card_purpose='budget', is_active=True, **card_data)
            db.session.add(card)
            created_cards.append(card)
        
        db.session.commit()
        
        card_transactions = [
            (created_cards[0], 'Grocery Store', Decimal('85.50'), 25),
            (created_cards[0], 'Restaurant Dinner', Decimal('120.00'), 18),
            (created_cards[0], 'Coffee Shop', Decimal('45.00'), 10),
            (created_cards[1], 'Movie Tickets', Decimal('75.00'), 22),
            (created_cards[1], 'Concert', Decimal('70.00'), 12),
            (created_cards[3], 'Gas Station', Decimal('50.00'), 14),
            (created_cards[3], 'Uber', Decimal('37.25'), 7),
        ]
        
        for card, desc, amount, days_ago in card_transactions:
            timestamp = datetime.utcnow() - timedelta(days=days_ago)
            transaction = Transaction(
                user_id=user.id,
                card_id=card.id,
                transaction_type='expense',
                amount=-amount,
                description=desc,
                status='completed',
                created_at=timestamp,
                completed_at=timestamp,
                transaction_metadata={'category': card.category, 'card_name': card.card_name}
            )
            db.session.add(transaction)
        
        print(f"   ✅ Created {len(budget_cards_data)} budget cards with {len(card_transactions)} transactions")
        
        # 3. TRANSACTIONS
        print("\n📊 Creating Transaction History...")
        additional_transactions = [
            ('income', Decimal('1500.00'), 'Monthly Scholarship', 90, 'Income'),
            ('income', Decimal('1500.00'), 'Monthly Scholarship', 60, 'Income'),
            ('income', Decimal('1500.00'), 'Monthly Scholarship', 30, 'Income'),
            ('expense', Decimal('-250.00'), 'Textbooks & Materials', 75, 'Education'),
            ('expense', Decimal('-180.00'), 'Utility Bills', 50, 'Bills'),
            ('expense', Decimal('-95.00'), 'Phone Bill', 35, 'Bills'),
            ('expense', Decimal('-120.00'), 'Gym Membership', 28, 'Health'),
            ('payment', Decimal('-450.00'), 'Rent Payment', 65, 'Housing'),
            ('payment', Decimal('-450.00'), 'Rent Payment', 35, 'Housing'),
            ('payment', Decimal('-450.00'), 'Rent Payment', 5, 'Housing'),
        ]
        
        for tx_type, amount, desc, days_ago, category in additional_transactions:
            timestamp = datetime.utcnow() - timedelta(days=days_ago)
            transaction = Transaction(
                user_id=user.id,
                transaction_type=tx_type,
                amount=amount,
                description=desc,
                status='completed',
                created_at=timestamp,
                completed_at=timestamp,
                transaction_metadata={'category': category}
            )
            db.session.add(transaction)
        
        upcoming_payments = [
            ('Rent Payment', Decimal('450.00'), 5),
            ('Electricity Bill', Decimal('85.00'), 10),
            ('Internet Subscription', Decimal('50.00'), 15),
        ]
        
        for desc, amount, days_future in upcoming_payments:
            due_date = datetime.utcnow() + timedelta(days=days_future)
            transaction = Transaction(
                user_id=user.id,
                transaction_type='reminder',
                amount=-amount,
                description=desc,
                status='pending',
                created_at=datetime.utcnow(),
                transaction_metadata={'due_date': due_date.isoformat()}
            )
            db.session.add(transaction)
        
        print(f"   ✅ Created {len(additional_transactions)} transactions + {len(upcoming_payments)} reminders")
        
        # 4. GOALS
        print("\n🎯 Creating Savings Goals...")
        goals = [
            {'title': 'Laptop Fund', 'description': 'Save for new MacBook Pro', 'target_amount': Decimal('2000.00'), 'current_amount': Decimal('850.00'), 'target_date': (datetime.utcnow() + timedelta(days=120)).date(), 'icon': '💻', 'color': '#3b82f6'},
            {'title': 'Travel Fund', 'description': 'Summer vacation', 'target_amount': Decimal('3000.00'), 'current_amount': Decimal('1200.00'), 'target_date': (datetime.utcnow() + timedelta(days=180)).date(), 'icon': '✈️', 'color': '#f59e0b'},
            {'title': 'Emergency Fund', 'description': '3 months savings', 'target_amount': Decimal('5000.00'), 'current_amount': Decimal('2300.00'), 'target_date': (datetime.utcnow() + timedelta(days=365)).date(), 'icon': '🏦', 'color': '#10b981'},
        ]
        
        for goal_data in goals:
            goal = Goal(user_id=user.id, **goal_data)
            db.session.add(goal)
        
        print(f"   ✅ Created {len(goals)} savings goals")
        
        # 5. DARK DAYS POCKET
        print("\n🏦 Creating Dark Days Pocket...")
        pocket = SavingsPocket(
            user_id=user.id,
            name='DarkDays Emergency Fund',
            balance=Decimal('750.00'),
            goal_amount=Decimal('3000.00'),
            auto_save_enabled=True,
            auto_save_percentage=20,
            auto_save_frequency='monthly',
            next_auto_save_date=(datetime.utcnow() + timedelta(days=30)).date()
        )
        db.session.add(pocket)
        print("   ✅ Created Dark Days Pocket")
        
        # 6. MARKETPLACE
        print("\n🛒 Creating Marketplace Listings...")
        listings = [
            {'title': 'Algorithms Textbook', 'description': 'CLRS 3rd edition', 'category': 'Books', 'price': Decimal('45.00'), 'condition': 'Like New', 'is_available': True},
            {'title': 'TI-84 Calculator', 'description': 'Graphing calculator', 'category': 'Electronics', 'price': Decimal('80.00'), 'condition': 'Excellent', 'is_available': True},
            {'title': 'Desk Lamp', 'description': 'LED study light', 'category': 'Furniture', 'price': Decimal('25.00'), 'condition': 'Good', 'is_available': True},
            {'title': 'Python Course Notes', 'description': 'Complete notes', 'category': 'Notes', 'price': Decimal('15.00'), 'condition': 'Good', 'is_available': False, 'is_sold': True},
        ]
        
        for listing_data in listings:
            listing = MarketplaceListing(seller_id=user.id, **listing_data)
            db.session.add(listing)
        
        print(f"   ✅ Created {len(listings)} marketplace listings")
        
        # 7. LOANS
        print("\n💰 Creating Loans...")
        
        # Pending
        pending = [
            {'lender_id': other_users[0].id, 'borrower_id': user.id, 'amount': Decimal('250.00'), 'description': 'Semester books', 'status': 'pending', 'due_date': (datetime.utcnow() + timedelta(days=60)).date()},
            {'lender_id': user.id, 'borrower_id': other_users[5].id, 'amount': Decimal('100.00'), 'description': 'Event ticket', 'status': 'pending', 'due_date': (datetime.utcnow() + timedelta(days=30)).date()},
        ]
        for loan_data in pending:
            db.session.add(Loan(**loan_data))
        
        # Owed to Me
        owed_to_me = [
            {'lender_id': user.id, 'borrower_id': other_users[1].id, 'amount': Decimal('150.00'), 'amount_repaid': Decimal('50.00'), 'description': 'Library fee', 'status': 'active', 'due_date': (datetime.utcnow() + timedelta(days=45)).date()},
            {'lender_id': user.id, 'borrower_id': other_users[2].id, 'amount': Decimal('200.00'), 'amount_repaid': Decimal('100.00'), 'description': 'Laptop repair', 'status': 'active', 'due_date': (datetime.utcnow() + timedelta(days=30)).date()},
        ]
        for loan_data in owed_to_me:
            loan = Loan(**loan_data)
            db.session.add(loan)
            db.session.flush()
            db.session.add(LoanRepayment(loan_id=loan.id, amount=loan_data['amount_repaid'], created_at=datetime.utcnow() - timedelta(days=15)))
        
        # I Owe
        i_owe = [
            {'lender_id': other_users[3].id, 'borrower_id': user.id, 'amount': Decimal('300.00'), 'amount_repaid': Decimal('150.00'), 'description': 'Course registration', 'status': 'active', 'due_date': (datetime.utcnow() + timedelta(days=40)).date()},
            {'lender_id': other_users[4].id, 'borrower_id': user.id, 'amount': Decimal('175.00'), 'amount_repaid': Decimal('75.00'), 'description': 'Medical expenses', 'status': 'active', 'due_date': (datetime.utcnow() + timedelta(days=25)).date()},
        ]
        for loan_data in i_owe:
            loan = Loan(**loan_data)
            db.session.add(loan)
            db.session.flush()
            db.session.add(LoanRepayment(loan_id=loan.id, amount=loan_data['amount_repaid'], created_at=datetime.utcnow() - timedelta(days=10)))
        
        # History
        history = [
            {'lender_id': user.id, 'borrower_id': other_users[6].id, 'amount': Decimal('120.00'), 'amount_repaid': Decimal('120.00'), 'description': 'Textbook', 'status': 'completed', 'is_fully_repaid': True, 'repaid_at': datetime.utcnow() - timedelta(days=10)},
            {'lender_id': other_users[7].id, 'borrower_id': user.id, 'amount': Decimal('200.00'), 'amount_repaid': Decimal('200.00'), 'description': 'Travel costs', 'status': 'completed', 'is_fully_repaid': True, 'repaid_at': datetime.utcnow() - timedelta(days=20)},
        ]
        for loan_data in history:
            loan = Loan(**loan_data)
            db.session.add(loan)
            db.session.flush()
            if loan_data.get('is_fully_repaid'):
                db.session.add(LoanRepayment(loan_id=loan.id, amount=loan_data['amount'], created_at=loan_data['repaid_at']))
        
        print(f"   ✅ Created {len(pending) + len(owed_to_me) + len(i_owe) + len(history)} loans")
        
        db.session.commit()
        
        print(f"\n{'='*70}")
        print("✅ SEEDING COMPLETED!")
        print(f"{'='*70}")
        print(f"\nAccount: {user.email}")
        print(f"• Transfers: {len(incoming_transfers) + len(outgoing_transfers)}")
        print(f"• Budget Cards: {len(budget_cards_data)}")
        print(f"• Transactions: {len(additional_transactions) + len(card_transactions)}")
        print(f"• Goals: {len(goals)}")
        print(f"• Dark Days Pocket: ✅")
        print(f"• Marketplace: {len(listings)}")
        print(f"• Loans: {len(pending) + len(owed_to_me) + len(i_owe) + len(history)}")
        print(f"{'='*70}\n")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python backend/seed_any_account.py <email>")
        print("Example: python backend/seed_any_account.py student@test.com")
        sys.exit(1)
    
    email = sys.argv[1]
    seed_account(email)

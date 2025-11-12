"""
Comprehensive Test Data Seeder for StudentKlombaTest Account
==============================================================

This script populates the complete test dataset for the StudentKlombaTest@test.com account
across all UniPay features:
- User Account & Wallet
- Transfers (incoming & outgoing)
- Budget Cards with transactions
- Activity/Transactions history
- Goals & Savings
- Dark Days Pocket
- Marketplace Listings
- Loans (Pending, Owed to Me, I Owe, History)

Usage:
    python backend/seed_student_klomba_full.py
"""

from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.wallet import Wallet
from app.models.transaction import Transaction
from app.models.virtual_card import VirtualCard
from app.models.goal import Goal
from app.models.savings_pocket import SavingsPocket
from app.models.marketplace import MarketplaceListing
from app.models.loan import Loan, LoanRepayment
from decimal import Decimal
from datetime import datetime, timedelta
import random

def seed_student_klomba_account():
    app = create_app()
    
    with app.app_context():
        print("\n" + "="*70)
        print("STUDENT KLOMBA TEST DATA SEEDER")
        print("="*70 + "\n")
        
        # ============================================================
        # 1. CREATE OR GET USER ACCOUNT
        # ============================================================
        print("📝 Step 1: Creating/Getting StudentKlombaTest account...")
        
        user = User.query.filter_by(email='StudentKlombaTest@test.com').first()
        
        if user:
            print(f"   ⚠️  Account already exists: {user.email}")
        else:
            user = User(
                email='StudentKlombaTest@test.com',
                username='StudentKlomba',
                first_name='Student',
                last_name='Klomba',
                university='Klomba University',
                faculty='Computer Science'
            )
            user.set_password('password123')
            user.set_pin('1234')
            db.session.add(user)
            db.session.flush()
            
            # Create wallet
            wallet = Wallet(
                user_id=user.id,
                balance=Decimal('2500.00'),
                currency='USD'
            )
            db.session.add(wallet)
            db.session.commit()
            print(f"   ✅ Created user: {user.email} (ID: {user.id}, Balance: $2500)")
        
        # Get all other users for transfers and loans
        other_users = User.query.filter(User.id != user.id).limit(10).all()
        if len(other_users) < 3:
            print("   ⚠️  Warning: Not enough other users for transfers/loans. Create more users first.")
            return
        
        # ============================================================
        # 2. CREATE TRANSFERS (INCOMING & OUTGOING)
        # ============================================================
        print("\n💸 Step 2: Creating Transfers (Incoming & Outgoing)...")
        
        # Incoming transfers (others send money TO StudentKlomba)
        incoming_transfers = [
            {
                'from_user': other_users[0],
                'amount': Decimal('150.00'),
                'description': 'Rent split - September',
                'days_ago': 85
            },
            {
                'from_user': other_users[1],
                'amount': Decimal('75.50'),
                'description': 'Dinner payment',
                'days_ago': 45
            },
            {
                'from_user': other_users[2],
                'amount': Decimal('200.00'),
                'description': 'Concert ticket reimbursement',
                'days_ago': 30
            },
            {
                'from_user': other_users[3],
                'amount': Decimal('50.00'),
                'description': 'Book purchase',
                'days_ago': 15
            },
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
        
        # Outgoing transfers (StudentKlomba sends money TO others)
        outgoing_transfers = [
            {
                'to_user': other_users[0],
                'amount': Decimal('100.00'),
                'description': 'Monthly subscription share',
                'days_ago': 60
            },
            {
                'to_user': other_users[4],
                'amount': Decimal('125.00'),
                'description': 'Study materials',
                'days_ago': 40
            },
            {
                'to_user': other_users[1],
                'amount': Decimal('80.00'),
                'description': 'Birthday gift contribution',
                'days_ago': 20
            },
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
        
        db.session.commit()
        print(f"   ✅ Created {len(incoming_transfers)} incoming transfers")
        print(f"   ✅ Created {len(outgoing_transfers)} outgoing transfers")
        
        # ============================================================
        # 3. CREATE BUDGET CARDS WITH TRANSACTION HISTORY
        # ============================================================
        print("\n💳 Step 3: Creating Budget Cards...")
        
        budget_cards = [
            {
                'card_name': 'Food & Drink',
                'category': 'Food & Dining',
                'icon': '🍔',
                'color': '#ef4444',
                'allocated_amount': Decimal('500.00'),
                'spent_amount': Decimal('325.50'),
                'monthly_limit': Decimal('500.00')
            },
            {
                'card_name': 'Entertainment',
                'category': 'Entertainment',
                'icon': '🎬',
                'color': '#8b5cf6',
                'allocated_amount': Decimal('200.00'),
                'spent_amount': Decimal('145.00'),
                'monthly_limit': Decimal('200.00')
            },
            {
                'card_name': 'Savings Card',
                'category': 'Savings',
                'icon': '💰',
                'color': '#10b981',
                'allocated_amount': Decimal('300.00'),
                'spent_amount': Decimal('0.00'),
                'monthly_limit': Decimal('300.00')
            },
            {
                'card_name': 'Transport',
                'category': 'Transportation',
                'icon': '🚗',
                'color': '#3b82f6',
                'allocated_amount': Decimal('150.00'),
                'spent_amount': Decimal('87.25'),
                'monthly_limit': Decimal('150.00')
            },
        ]
        
        created_cards = []
        for card_data in budget_cards:
            card = VirtualCard(
                user_id=user.id,
                card_purpose='budget',
                **card_data,
                is_active=True
            )
            db.session.add(card)
            created_cards.append(card)
        
        db.session.commit()
        print(f"   ✅ Created {len(budget_cards)} budget cards")
        
        # Add transactions for budget cards
        print("   📊 Adding transaction history to budget cards...")
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
        
        db.session.commit()
        print(f"   ✅ Added {len(card_transactions)} transactions to budget cards")
        
        # ============================================================
        # 4. CREATE ACTIVITY / TRANSACTIONS
        # ============================================================
        print("\n📈 Step 4: Creating Activity & Transaction History...")
        
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
        
        # Add upcoming payments (reminders)
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
        
        db.session.commit()
        print(f"   ✅ Created {len(additional_transactions)} historical transactions")
        print(f"   ✅ Created {len(upcoming_payments)} upcoming payment reminders")
        
        # ============================================================
        # 5. CREATE GOALS & SAVINGS
        # ============================================================
        print("\n🎯 Step 5: Creating Savings Goals...")
        
        goals = [
            {
                'title': 'Laptop Fund',
                'description': 'Save for new MacBook Pro for studies',
                'target_amount': Decimal('2000.00'),
                'current_amount': Decimal('850.00'),
                'target_date': (datetime.utcnow() + timedelta(days=120)).date(),
                'icon': '💻',
                'color': '#3b82f6'
            },
            {
                'title': 'Travel Fund',
                'description': 'Summer vacation in Europe',
                'target_amount': Decimal('3000.00'),
                'current_amount': Decimal('1200.00'),
                'target_date': (datetime.utcnow() + timedelta(days=180)).date(),
                'icon': '✈️',
                'color': '#f59e0b'
            },
            {
                'title': 'Emergency Fund',
                'description': 'Build 3 months emergency savings',
                'target_amount': Decimal('5000.00'),
                'current_amount': Decimal('2300.00'),
                'target_date': (datetime.utcnow() + timedelta(days=365)).date(),
                'icon': '🏦',
                'color': '#10b981'
            },
        ]
        
        for goal_data in goals:
            goal = Goal(
                user_id=user.id,
                **goal_data
            )
            db.session.add(goal)
        
        db.session.commit()
        print(f"   ✅ Created {len(goals)} savings goals")
        
        # ============================================================
        # 6. CREATE DARK DAYS POCKET
        # ============================================================
        print("\n🏦 Step 6: Creating Dark Days Pocket...")
        
        dark_days_pocket = SavingsPocket(
            user_id=user.id,
            name='DarkDays Emergency Fund',
            balance=Decimal('750.00'),
            goal_amount=Decimal('3000.00'),
            auto_save_enabled=True,
            auto_save_percentage=20,
            auto_save_frequency='monthly',
            next_auto_save_date=(datetime.utcnow() + timedelta(days=30)).date(),
            created_at=datetime.utcnow() - timedelta(days=90)
        )
        db.session.add(dark_days_pocket)
        db.session.commit()
        print(f"   ✅ Created Dark Days Pocket (Balance: $750, Auto-save: 20%)")
        
        # ============================================================
        # 7. CREATE MARKETPLACE LISTINGS
        # ============================================================
        print("\n🛒 Step 7: Creating Marketplace Listings...")
        
        marketplace_listings = [
            {
                'title': 'Introduction to Algorithms Textbook',
                'description': 'CLRS Algorithms book, 3rd edition. Excellent condition with minimal highlighting.',
                'category': 'Books',
                'price': Decimal('45.00'),
                'condition': 'Like New',
                'university': 'Klomba University',
                'faculty': 'Computer Science',
                'course': 'CS201',
                'is_available': True
            },
            {
                'title': 'Scientific Calculator TI-84',
                'description': 'Texas Instruments TI-84 Plus graphing calculator. Barely used.',
                'category': 'Electronics',
                'price': Decimal('80.00'),
                'condition': 'Excellent',
                'university': 'Klomba University',
                'is_available': True
            },
            {
                'title': 'Desk Lamp - Study Light',
                'description': 'Adjustable LED desk lamp with USB charging port.',
                'category': 'Furniture',
                'price': Decimal('25.00'),
                'condition': 'Good',
                'university': 'Klomba University',
                'is_available': True
            },
            {
                'title': 'Python Programming Course Notes',
                'description': 'Complete handwritten notes from Python CS101 course.',
                'category': 'Notes',
                'price': Decimal('15.00'),
                'condition': 'Good',
                'university': 'Klomba University',
                'faculty': 'Computer Science',
                'course': 'CS101',
                'is_available': False,
                'is_sold': True
            },
        ]
        
        for listing_data in marketplace_listings:
            listing = MarketplaceListing(
                seller_id=user.id,
                **listing_data,
                created_at=datetime.utcnow() - timedelta(days=random.randint(5, 60))
            )
            db.session.add(listing)
        
        db.session.commit()
        print(f"   ✅ Created {len(marketplace_listings)} marketplace listings")
        
        # ============================================================
        # 8. CREATE LOANS (ALL 4 CATEGORIES)
        # ============================================================
        print("\n💰 Step 8: Creating Loans (Pending, Owed to Me, I Owe, History)...")
        
        # A) PENDING REQUESTS - Loans requested but not yet approved
        pending_loans = [
            {
                'lender_id': other_users[0].id,
                'borrower_id': user.id,
                'amount': Decimal('250.00'),
                'description': 'Semester books purchase',
                'status': 'pending',
                'due_date': (datetime.utcnow() + timedelta(days=60)).date(),
                'created_at': datetime.utcnow() - timedelta(days=2)
            },
            {
                'lender_id': user.id,
                'borrower_id': other_users[5].id,
                'amount': Decimal('100.00'),
                'description': 'Event ticket advance',
                'status': 'pending',
                'due_date': (datetime.utcnow() + timedelta(days=30)).date(),
                'created_at': datetime.utcnow() - timedelta(days=1)
            },
        ]
        
        for loan_data in pending_loans:
            loan = Loan(**loan_data)
            db.session.add(loan)
        
        # B) OWED TO ME - Active loans where StudentKlomba is the lender
        owed_to_me = [
            {
                'lender_id': user.id,
                'borrower_id': other_users[1].id,
                'amount': Decimal('150.00'),
                'amount_repaid': Decimal('50.00'),
                'description': 'Library membership fee',
                'status': 'active',
                'due_date': (datetime.utcnow() + timedelta(days=45)).date(),
                'created_at': datetime.utcnow() - timedelta(days=30)
            },
            {
                'lender_id': user.id,
                'borrower_id': other_users[2].id,
                'amount': Decimal('200.00'),
                'amount_repaid': Decimal('100.00'),
                'description': 'Laptop repair costs',
                'status': 'active',
                'due_date': (datetime.utcnow() + timedelta(days=30)).date(),
                'created_at': datetime.utcnow() - timedelta(days=45)
            },
        ]
        
        for loan_data in owed_to_me:
            loan = Loan(**loan_data)
            db.session.add(loan)
            db.session.flush()
            
            # Add partial repayment
            repayment = LoanRepayment(
                loan_id=loan.id,
                amount=loan_data['amount_repaid'],
                created_at=datetime.utcnow() - timedelta(days=15)
            )
            db.session.add(repayment)
        
        # C) I OWE - Active loans where StudentKlomba is the borrower
        i_owe = [
            {
                'lender_id': other_users[3].id,
                'borrower_id': user.id,
                'amount': Decimal('300.00'),
                'amount_repaid': Decimal('150.00'),
                'description': 'Course registration emergency',
                'status': 'active',
                'due_date': (datetime.utcnow() + timedelta(days=40)).date(),
                'created_at': datetime.utcnow() - timedelta(days=50)
            },
            {
                'lender_id': other_users[4].id,
                'borrower_id': user.id,
                'amount': Decimal('175.00'),
                'amount_repaid': Decimal('75.00'),
                'description': 'Medical expenses',
                'status': 'active',
                'due_date': (datetime.utcnow() + timedelta(days=25)).date(),
                'created_at': datetime.utcnow() - timedelta(days=35)
            },
        ]
        
        for loan_data in i_owe:
            loan = Loan(**loan_data)
            db.session.add(loan)
            db.session.flush()
            
            # Add partial repayment
            repayment = LoanRepayment(
                loan_id=loan.id,
                amount=loan_data['amount_repaid'],
                created_at=datetime.utcnow() - timedelta(days=10)
            )
            db.session.add(repayment)
        
        # D) HISTORY - Completed/Cancelled loans
        history_loans = [
            {
                'lender_id': user.id,
                'borrower_id': other_users[6].id,
                'amount': Decimal('120.00'),
                'amount_repaid': Decimal('120.00'),
                'description': 'Textbook purchase',
                'status': 'completed',
                'is_fully_repaid': True,
                'due_date': (datetime.utcnow() - timedelta(days=10)).date(),
                'created_at': datetime.utcnow() - timedelta(days=80),
                'repaid_at': datetime.utcnow() - timedelta(days=10)
            },
            {
                'lender_id': other_users[7].id,
                'borrower_id': user.id,
                'amount': Decimal('200.00'),
                'amount_repaid': Decimal('200.00'),
                'description': 'Internship travel costs',
                'status': 'completed',
                'is_fully_repaid': True,
                'due_date': (datetime.utcnow() - timedelta(days=20)).date(),
                'created_at': datetime.utcnow() - timedelta(days=100),
                'repaid_at': datetime.utcnow() - timedelta(days=20)
            },
            {
                'lender_id': user.id,
                'borrower_id': other_users[8].id,
                'amount': Decimal('50.00'),
                'amount_repaid': Decimal('0.00'),
                'description': 'Group project expenses',
                'status': 'cancelled',
                'created_at': datetime.utcnow() - timedelta(days=70),
                'cancelled_at': datetime.utcnow() - timedelta(days=65)
            },
        ]
        
        for loan_data in history_loans:
            loan = Loan(**loan_data)
            db.session.add(loan)
            db.session.flush()
            
            if loan_data.get('is_fully_repaid'):
                repayment = LoanRepayment(
                    loan_id=loan.id,
                    amount=loan_data['amount'],
                    created_at=loan_data['repaid_at']
                )
                db.session.add(repayment)
        
        db.session.commit()
        print(f"   ✅ Created {len(pending_loans)} pending loan requests")
        print(f"   ✅ Created {len(owed_to_me)} active loans (Owed to Me)")
        print(f"   ✅ Created {len(i_owe)} active loans (I Owe)")
        print(f"   ✅ Created {len(history_loans)} completed/cancelled loans (History)")
        
        # ============================================================
        # SUMMARY
        # ============================================================
        print("\n" + "="*70)
        print("✅ DATA SEEDING COMPLETED SUCCESSFULLY!")
        print("="*70)
        print(f"\n📊 Summary for StudentKlombaTest@test.com:")
        print(f"   • User ID: {user.id}")
        print(f"   • Wallet Balance: ${user.wallet.balance}")
        print(f"   • Transfers: {len(incoming_transfers) + len(outgoing_transfers)} total")
        print(f"   • Budget Cards: {len(budget_cards)}")
        print(f"   • Transactions: {len(additional_transactions) + len(card_transactions)} historical")
        print(f"   • Upcoming Payments: {len(upcoming_payments)}")
        print(f"   • Savings Goals: {len(goals)}")
        print(f"   • Dark Days Pocket: $750.00 (20% auto-save)")
        print(f"   • Marketplace Listings: {len(marketplace_listings)}")
        print(f"   • Loans Total: {len(pending_loans) + len(owed_to_me) + len(i_owe) + len(history_loans)}")
        print(f"     - Pending Requests: {len(pending_loans)}")
        print(f"     - Owed to Me: {len(owed_to_me)}")
        print(f"     - I Owe: {len(i_owe)}")
        print(f"     - History: {len(history_loans)}")
        
        print("\n🔐 Login Credentials:")
        print(f"   Email: StudentKlombaTest@test.com")
        print(f"   Password: password123")
        print(f"   PIN: 1234")
        
        print("\n" + "="*70 + "\n")

if __name__ == '__main__':
    seed_student_klomba_account()

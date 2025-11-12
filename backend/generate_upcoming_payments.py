"""
Generate Upcoming Payment Entries for Calendar

This script creates realistic upcoming payment transactions for November 2025
to enhance the calendar visualization with scheduled/pending payments.
"""

import os
import sys
from datetime import datetime, timedelta
from decimal import Decimal

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.extensions import db
from app.models import Transaction, User

# Upcoming payment templates
UPCOMING_PAYMENTS = [
    # Rent payments
    {
        "description": "Dorm Rent Payment",
        "amount": 350.00,
        "day": 21,  # November 21
        "transaction_type": "payment",
        "category": "rent"
    },
    {
        "description": "Monthly Rent",
        "amount": 425.00,
        "day": 25,  # November 25
        "transaction_type": "payment",
        "category": "rent"
    },
    
    # Subscription renewals
    {
        "description": "Netflix Subscription",
        "amount": 15.99,
        "day": 15,  # November 15
        "transaction_type": "payment",
        "category": "subscription"
    },
    {
        "description": "Spotify Premium",
        "amount": 10.99,
        "day": 18,  # November 18
        "transaction_type": "payment",
        "category": "subscription"
    },
    {
        "description": "Adobe Creative Cloud",
        "amount": 54.99,
        "day": 12,  # November 12
        "transaction_type": "payment",
        "category": "subscription"
    },
    {
        "description": "Gym Membership",
        "amount": 45.00,
        "day": 10,  # November 10
        "transaction_type": "payment",
        "category": "subscription"
    },
    
    # Utility bills
    {
        "description": "Internet Bill",
        "amount": 60.00,
        "day": 15,  # November 15
        "transaction_type": "payment",
        "category": "utilities"
    },
    {
        "description": "Phone Bill",
        "amount": 35.00,
        "day": 20,  # November 20
        "transaction_type": "payment",
        "category": "utilities"
    },
]

def main():
    app = create_app()
    
    with app.app_context():
        print("=" * 80)
        print("GENERATING UPCOMING PAYMENT ENTRIES")
        print("=" * 80)
        print()
        
        # Get active users (those with existing transactions)
        # Use a subquery to avoid ambiguous foreign key issue
        user_ids_with_transactions = db.session.query(Transaction.user_id).distinct().all()
        user_ids = [uid[0] for uid in user_ids_with_transactions]
        active_users = User.query.filter(User.id.in_(user_ids)).all()
        
        total_created = 0
        
        # Assign upcoming payments to users
        for i, user in enumerate(active_users[:8]):  # Assign to first 8 active users
            # Each user gets 1-3 upcoming payments
            num_payments = min((i % 3) + 1, len(UPCOMING_PAYMENTS))
            user_payments = UPCOMING_PAYMENTS[i:i+num_payments]
            
            print(f"\n{'='*80}")
            print(f"User: {user.username} (ID: {user.id})")
            print(f"Assigning {num_payments} upcoming payment(s)")
            print(f"{'='*80}")
            
            for payment in user_payments:
                # Create upcoming payment date (November 2025)
                payment_date = datetime(2025, 11, payment['day'], 9, 0, 0)
                
                # Create transaction with 'scheduled' status
                # Use the scheduled payment date as created_at for calendar display
                new_txn = Transaction(
                    user_id=user.id,
                    transaction_type=payment['transaction_type'],
                    amount=Decimal(str(payment['amount'])),
                    currency="USD",
                    status="scheduled",  # Use 'scheduled' status for upcoming payments
                    description=payment['description'],
                    created_at=payment_date,  # Set to scheduled date for calendar display
                    completed_at=None,  # Not yet completed
                    transaction_metadata={
                        "source": "UPCOMING_PAYMENTS_2025",
                        "category": payment['category'],
                        "scheduled": True,
                        "upcoming": True
                    }
                )
                
                db.session.add(new_txn)
                total_created += 1
                
                print(f"  📅 {payment_date.strftime('%b %d')} | ${payment['amount']:<7.2f} | {payment['description']}")
        
        # Commit all transactions
        db.session.commit()
        
        print("\n" + "=" * 80)
        print("UPCOMING PAYMENTS CREATED SUCCESSFULLY")
        print("=" * 80)
        print(f"\nTotal Upcoming Payments: {total_created}")
        print("\nThese will appear on the calendar with yellow color indicators")
        print("and are marked as 'scheduled' status.")
        print("\n" + "=" * 80)

if __name__ == "__main__":
    main()

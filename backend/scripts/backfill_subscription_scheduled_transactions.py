"""
Backfill scheduled transactions for existing subscriptions.

This script creates scheduled subscription payment transactions for any active 
subscriptions that don't already have a corresponding scheduled transaction.

Usage:
    cd backend && python scripts/backfill_subscription_scheduled_transactions.py
"""

import sys
import os

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from datetime import datetime
from app import create_app
from app.extensions import db
from app.models import Subscription, Transaction, VirtualCard

def backfill_scheduled_transactions():
    """Create scheduled transactions for existing active subscriptions without them."""
    
    app = create_app()
    
    with app.app_context():
        # Find all active subscriptions
        active_subscriptions = Subscription.query.filter_by(is_active=True).all()
        
        print(f"Found {len(active_subscriptions)} active subscriptions")
        
        created_count = 0
        skipped_count = 0
        
        for subscription in active_subscriptions:
            # Check if a scheduled transaction already exists for this subscription
            from sqlalchemy.dialects.postgresql import JSONB
            from sqlalchemy import cast, and_
            
            existing_transaction = Transaction.query.filter(
                and_(
                    Transaction.status == 'scheduled',
                    Transaction.transaction_metadata.op('->>')('subscription_id') == str(subscription.id)
                )
            ).first()
            
            if existing_transaction:
                print(f"  ✓ Subscription {subscription.id} ({subscription.service_name}) already has scheduled transaction")
                skipped_count += 1
                continue
            
            # Skip if no next billing date
            if not subscription.next_billing_date:
                print(f"  ⚠ Subscription {subscription.id} ({subscription.service_name}) has no next_billing_date, skipping")
                skipped_count += 1
                continue
            
            # Get the card to find user_id
            card = VirtualCard.query.get(subscription.card_id)
            if not card:
                print(f"  ✗ Subscription {subscription.id} ({subscription.service_name}) has invalid card_id, skipping")
                skipped_count += 1
                continue
            
            # Create scheduled transaction
            next_billing_datetime = datetime.combine(
                subscription.next_billing_date, 
                datetime.min.time()
            )
            
            scheduled_transaction = Transaction(
                user_id=card.user_id,
                transaction_type='subscription_payment',
                transaction_source='budget_card',
                amount=float(subscription.amount),
                status='scheduled',
                description=f'{subscription.service_name} - {subscription.billing_cycle} subscription',
                transaction_metadata={
                    'source': 'SUBSCRIPTION_PAYMENT',
                    'subscription_id': subscription.id,
                    'card_id': subscription.card_id,
                    'billing_cycle': subscription.billing_cycle,
                    'scheduled': True,
                    'upcoming': True,
                    'category': subscription.service_category or 'subscription',
                    'display_color': '#FACC15'
                },
                created_at=next_billing_datetime
            )
            
            db.session.add(scheduled_transaction)
            print(f"  + Created scheduled transaction for {subscription.service_name} on {subscription.next_billing_date}")
            created_count += 1
        
        # Commit all changes
        db.session.commit()
        
        print(f"\n✓ Backfill complete:")
        print(f"  - Created: {created_count} scheduled transactions")
        print(f"  - Skipped: {skipped_count} subscriptions (already had transactions or invalid data)")
        print(f"  - Total processed: {len(active_subscriptions)} subscriptions")

if __name__ == '__main__':
    backfill_scheduled_transactions()

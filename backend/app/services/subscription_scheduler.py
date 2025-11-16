from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from app.extensions import db
from app.models.subscription import Subscription
from app.models.transaction import Transaction


class SubscriptionSchedulerService:
    """
    Service to manage automatic generation of upcoming subscription payments.
    Ensures each active subscription has its next payment scheduled within the horizon.
    """
    
    @staticmethod
    def ensure_next_payment(subscription, horizon_date=None):
        """
        Ensure a subscription has its next payment scheduled.
        Creates a scheduled transaction if one doesn't exist within the horizon.
        
        Args:
            subscription: Subscription model instance
            horizon_date: Max date to schedule ahead (default: today + 31 days)
        
        Returns:
            Created or existing scheduled transaction, or None if not needed
        """
        if not subscription.is_active or not subscription.auto_renew:
            return None
            
        if not subscription.next_billing_date:
            return None
            
        if horizon_date is None:
            horizon_date = datetime.utcnow().date() + timedelta(days=31)
        
        if subscription.next_billing_date > horizon_date:
            return None
        
        existing_scheduled = Transaction.query.filter(
            Transaction.transaction_metadata['subscription_id'].astext == str(subscription.id),
            Transaction.status == 'scheduled',
            Transaction.created_at >= datetime.combine(subscription.next_billing_date, datetime.min.time())
        ).first()
        
        if existing_scheduled:
            return existing_scheduled
        
        next_billing_datetime = datetime.combine(subscription.next_billing_date, datetime.min.time())
        
        scheduled_transaction = Transaction(
            user_id=subscription.card.user_id,
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
                'display_color': '#FACC15',
                'service_name': subscription.service_name
            },
            created_at=next_billing_datetime,
            card_id=subscription.card_id
        )
        
        db.session.add(scheduled_transaction)
        
        return scheduled_transaction
    
    @staticmethod
    def sync_all_active(horizon_date=None):
        """
        Sync all active subscriptions to ensure they have upcoming payments scheduled.
        
        Args:
            horizon_date: Max date to schedule ahead (default: today + 31 days)
        
        Returns:
            Dict with counts of synced, skipped, and created transactions
        """
        if horizon_date is None:
            horizon_date = datetime.utcnow().date() + timedelta(days=31)
        
        active_subscriptions = Subscription.query.filter_by(
            is_active=True,
            auto_renew=True
        ).all()
        
        synced_count = 0
        skipped_count = 0
        created_count = 0
        
        for subscription in active_subscriptions:
            if not subscription.next_billing_date:
                skipped_count += 1
                continue
            
            result = SubscriptionSchedulerService.ensure_next_payment(subscription, horizon_date)
            
            if result:
                if result.id:
                    synced_count += 1
                else:
                    created_count += 1
                    synced_count += 1
        
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise e
        
        return {
            'synced': synced_count,
            'skipped': skipped_count,
            'created': created_count,
            'total_active': len(active_subscriptions)
        }
    
    @staticmethod
    def process_payment_completion(transaction):
        """
        Handle post-payment tasks when a subscription payment is completed.
        Updates subscription dates and creates next scheduled payment.
        
        Args:
            transaction: Completed transaction with subscription metadata
        
        Returns:
            Next scheduled transaction or None
        """
        if transaction.transaction_type != 'subscription_payment':
            return None
        
        metadata = transaction.transaction_metadata or {}
        subscription_id = metadata.get('subscription_id')
        
        if not subscription_id:
            return None
        
        subscription = Subscription.query.get(subscription_id)
        if not subscription:
            return None
        
        payment_date = transaction.completed_at.date() if transaction.completed_at else datetime.utcnow().date()
        
        subscription.last_payment_date = payment_date
        
        next_date = subscription.get_next_cycle_date(from_date=payment_date)
        if next_date:
            subscription.next_billing_date = next_date
        
        db.session.flush()
        
        if subscription.is_active and subscription.auto_renew and subscription.next_billing_date:
            return SubscriptionSchedulerService.ensure_next_payment(subscription)
        
        return None

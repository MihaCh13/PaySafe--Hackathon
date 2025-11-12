"""
Income Rebalancing Script
Generates realistic income transactions to balance expenses across all user accounts.
"""

import os
import sys
import random
from datetime import datetime, timedelta
from decimal import Decimal

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.extensions import db
from app.models import Transaction, User, Wallet

# Income transaction descriptions with amounts
INCOME_SOURCES = [
    # Regular salary/work income ($500-$2000)
    {"desc": "Monthly Salary Payment", "min": 800, "max": 2000, "weight": 0.15},
    {"desc": "Freelance Project Payment", "min": 300, "max": 1500, "weight": 0.12},
    {"desc": "Part-time Job Payment", "min": 200, "max": 800, "weight": 0.10},
    
    # Transfers received ($50-$800)
    {"desc": "Bank Transfer Received", "min": 100, "max": 800, "weight": 0.10},
    {"desc": "Payment from Friend", "min": 50, "max": 500, "weight": 0.08},
    {"desc": "Family Support Transfer", "min": 150, "max": 600, "weight": 0.08},
    
    # Refunds ($20-$500)
    {"desc": "Refund from Purchase", "min": 20, "max": 300, "weight": 0.08},
    {"desc": "Course Fee Refund", "min": 50, "max": 500, "weight": 0.06},
    {"desc": "Subscription Refund", "min": 10, "max": 100, "weight": 0.05},
    
    # Side income ($50-$800)
    {"desc": "Online Tutoring Payment", "min": 50, "max": 400, "weight": 0.06},
    {"desc": "Design Work Payment", "min": 100, "max": 800, "weight": 0.05},
    {"desc": "Content Creation Earnings", "min": 75, "max": 500, "weight": 0.04},
    {"desc": "Survey Rewards", "min": 20, "max": 150, "weight": 0.03},
]

def get_random_income_transaction():
    """Get a random income transaction type with weighted probability."""
    sources = INCOME_SOURCES
    weights = [s["weight"] for s in sources]
    source = random.choices(sources, weights=weights, k=1)[0]
    
    amount = round(random.uniform(source["min"], source["max"]), 2)
    return {
        "description": source["desc"],
        "amount": amount,
        "transaction_type": random.choice(["income", "income", "topup", "refund"])
    }

def calculate_needed_income(user_id, current_income, current_expenses):
    """Calculate how much income is needed to achieve balance."""
    deficit = current_expenses - current_income
    
    # Target: Income should be 110-130% of expenses (positive balance)
    target_ratio = random.uniform(1.10, 1.30)
    target_income = current_expenses * target_ratio
    
    needed_income = max(0, target_income - current_income)
    return round(needed_income, 2)

def generate_realistic_date(start_date, end_date):
    """Generate a realistic transaction date weighted towards recent months."""
    total_days = (end_date - start_date).days
    
    # Weight more recent dates higher (60% in last 3 months)
    if random.random() < 0.60:
        # Last 3 months
        recent_start = end_date - timedelta(days=90)
        days_offset = random.randint(0, min(90, total_days))
        return recent_start + timedelta(days=days_offset)
    else:
        # Earlier dates
        days_offset = random.randint(0, total_days)
        return start_date + timedelta(days=days_offset)

def main():
    app = create_app()
    
    with app.app_context():
        print("=" * 80)
        print("INCOME REBALANCING SCRIPT")
        print("=" * 80)
        print()
        
        # Get all users with their financial data
        users = User.query.all()
        
        summary = []
        total_new_income = 0
        total_new_transactions = 0
        
        for user in users:
            # Calculate current totals
            income_txns = db.session.execute(db.text("""
                SELECT COALESCE(SUM(amount), 0) as total
                FROM transactions
                WHERE user_id = :user_id
                AND (
                    transaction_type IN ('topup', 'income', 'refund')
                    OR (transaction_type = 'transfer' AND receiver_id = :user_id)
                )
            """), {"user_id": user.id}).fetchone()
            
            expense_txns = db.session.execute(db.text("""
                SELECT COALESCE(SUM(amount), 0) as total
                FROM transactions
                WHERE user_id = :user_id
                AND (
                    transaction_type IN ('payment', 'purchase')
                    OR (transaction_type = 'transfer' AND sender_id = :user_id)
                )
            """), {"user_id": user.id}).fetchone()
            
            current_income = float(income_txns[0])
            current_expenses = float(expense_txns[0])
            
            # Skip users with already balanced finances
            if current_income >= current_expenses * 1.05:
                print(f"✓ {user.username:20} - Already balanced (${current_income:.2f} income vs ${current_expenses:.2f} expenses)")
                continue
            
            needed_income = calculate_needed_income(user.id, current_income, current_expenses)
            
            if needed_income <= 0:
                continue
            
            print(f"\n{'='*80}")
            print(f"User: {user.username} (ID: {user.id})")
            print(f"Current Income:  ${current_income:,.2f}")
            print(f"Current Expenses: ${current_expenses:,.2f}")
            print(f"Deficit:         ${(current_expenses - current_income):,.2f}")
            print(f"Target Income:   ${needed_income + current_income:,.2f}")
            print(f"New Income Needed: ${needed_income:,.2f}")
            print(f"{'='*80}")
            
            # Generate transactions to meet the target
            generated_amount = 0
            transactions_created = 0
            
            # Date range for new transactions (last 6 months)
            end_date = datetime(2025, 11, 8)  # Current date
            start_date = datetime(2025, 5, 13)  # 6 months ago
            
            while generated_amount < needed_income:
                remaining = needed_income - generated_amount
                
                # If remaining is very small, create one final transaction
                if remaining < 20:
                    txn_data = {
                        "description": "Payment from Friend",
                        "amount": round(remaining, 2),
                        "transaction_type": "income"
                    }
                else:
                    # Get random income transaction
                    txn_data = get_random_income_transaction()
                    
                    # Adjust amount if it would exceed the needed income significantly
                    if txn_data["amount"] > remaining:
                        txn_data["amount"] = round(remaining + random.uniform(-10, 10), 2)
                        # Ensure amount is positive
                        if txn_data["amount"] <= 0:
                            txn_data["amount"] = round(remaining, 2)
                
                # Generate realistic timestamp
                txn_date = generate_realistic_date(start_date, end_date)
                
                # Add random hours/minutes
                txn_date = txn_date.replace(
                    hour=random.randint(8, 22),
                    minute=random.randint(0, 59),
                    second=random.randint(0, 59)
                )
                
                # Create transaction
                new_txn = Transaction(
                    user_id=user.id,
                    transaction_type=txn_data["transaction_type"],
                    amount=Decimal(str(txn_data["amount"])),
                    currency="USD",
                    status="completed",
                    description=txn_data["description"],
                    created_at=txn_date,
                    completed_at=txn_date,
                    transaction_metadata={"source": "INCOME_REBALANCE_2025", "auto_generated": True}
                )
                
                # Set receiver_id for income transactions
                if txn_data["transaction_type"] == "income":
                    new_txn.receiver_id = user.id
                
                db.session.add(new_txn)
                
                generated_amount += txn_data["amount"]
                transactions_created += 1
                
                print(f"  + ${txn_data['amount']:>8.2f} | {txn_date.strftime('%Y-%m-%d %H:%M')} | {txn_data['description']}")
            
            # Commit transactions for this user
            db.session.commit()
            
            new_income = current_income + generated_amount
            new_balance = new_income - current_expenses
            
            summary.append({
                "username": user.username,
                "transactions": transactions_created,
                "added_income": generated_amount,
                "new_income": new_income,
                "new_balance": new_balance
            })
            
            total_new_income += generated_amount
            total_new_transactions += transactions_created
            
            print(f"\n  ✓ Created {transactions_created} transactions totaling ${generated_amount:,.2f}")
            print(f"  New Income: ${new_income:,.2f}")
            print(f"  New Balance: ${new_balance:,.2f}")
        
        # Print summary
        print("\n" + "=" * 80)
        print("REBALANCING COMPLETE")
        print("=" * 80)
        print(f"\nTotal New Transactions: {total_new_transactions}")
        print(f"Total Income Added: ${total_new_income:,.2f}")
        print()
        
        print(f"{'Username':<20} {'New Txns':<10} {'Income Added':<15} {'New Balance':<15}")
        print("-" * 80)
        for item in summary:
            print(f"{item['username']:<20} {item['transactions']:<10} ${item['added_income']:<14,.2f} ${item['new_balance']:<14,.2f}")
        
        print("\n" + "=" * 80)
        print("All transactions have been successfully generated and inserted!")
        print("The data will now be synchronized across:")
        print("  ✓ Activity Page - Summary Cards")
        print("  ✓ Activity Page - Transaction List")
        print("  ✓ Finance Timeline - Calendar View")
        print("  ✓ Dashboard - Account Overview")
        print("=" * 80)

if __name__ == "__main__":
    main()

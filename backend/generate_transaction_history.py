#!/usr/bin/env python3
"""
Transaction History Generator for UniPay
Generates realistic 6-month transaction history for all existing accounts.
"""

import os
import sys
import random
import csv
import json
from datetime import datetime, timedelta
from decimal import Decimal
from typing import List, Dict, Tuple

sys.path.insert(0, os.path.dirname(__file__))

from app import create_app, db
from app.models.user import User
from app.models.wallet import Wallet
from app.models.transaction import Transaction

GENERATOR_TAG = "HISTORICAL_GEN_2025"
MONTHS_BACK = 6
TRANSACTIONS_PER_WEEK = 4.0  # Increased from 3.5 to 4.0 for richer history
MIN_AMOUNT = Decimal('5.00')
MAX_AMOUNT = Decimal('500.00')
LARGE_AMOUNT_MAX = Decimal('1000.00')
LARGE_AMOUNT_PROBABILITY = 0.12  # Slightly increased for more variety

TRANSACTION_DESCRIPTIONS = {
    'income': [
        "Scholarship payment", "Part-time job salary", "Freelance project",
        "Student grant", "Refund from bookstore", "Parent transfer",
        "Tutoring payment", "Student loan disbursement", "Work study payment"
    ],
    'expense': [
        "Grocery shopping", "Coffee & snacks", "Textbooks", "Transport pass",
        "Restaurant", "Online subscription", "Mobile top-up", "Gym membership",
        "Study materials", "Entertainment", "Laundry", "Pizza delivery"
    ]
}


class TransactionGenerator:
    def __init__(self, dry_run=False, auto_confirm=False):
        self.app = create_app()
        self.dry_run = dry_run
        self.auto_confirm = auto_confirm
        self.generated_transactions = []
        self.account_summaries = {}
        self.skipped_items = []
        
    def run(self):
        """Main execution flow"""
        with self.app.app_context():
            print(f"\n{'='*70}")
            print(f"UniPay Transaction History Generator")
            print(f"{'='*70}")
            print(f"Mode: {'DRY RUN (no changes will be saved)' if self.dry_run else 'LIVE (will write to database)'}")
            print(f"Generator Tag: {GENERATOR_TAG}")
            print(f"Time Range: Past {MONTHS_BACK} months")
            print(f"{'='*70}\n")
            
            # Step 1: Load accounts
            accounts = self._load_accounts()
            if not accounts:
                print("❌ No accounts found. Exiting.")
                return
            
            # Step 2: Check for idempotency
            if self._check_existing_generated_transactions():
                if not self.auto_confirm:
                    response = input("\n⚠️  Generated transactions already exist. Continue anyway? (yes/no): ")
                    if response.lower() != 'yes':
                        print("Aborted by user.")
                        return
                else:
                    print("\n✅ Auto-confirmed: Adding more transactions to existing data...")
            
            # Step 3: Generate transactions
            transactions = self._generate_transactions(accounts)
            
            # Step 4: Insert transactions
            if not self.dry_run:
                self._insert_transactions(transactions)
                print("\n✅ Transactions inserted successfully!")
            else:
                print("\n✅ Dry run completed. No changes made.")
            
            # Step 5: Generate reports
            self._generate_reports()
            
            print(f"\n{'='*70}")
            print("Transaction generation completed!")
            print(f"{'='*70}\n")
    
    def _load_accounts(self) -> List[Dict]:
        """Load all user accounts with wallets"""
        users = User.query.join(Wallet).all()
        accounts = []
        
        print(f"📊 Found {len(users)} accounts:\n")
        for user in users:
            wallet = user.wallet
            account_data = {
                'user_id': user.id,
                'username': user.username,
                'email': user.email,
                'wallet_id': wallet.id,
                'initial_balance': Decimal(str(wallet.balance)),
                'current_balance': Decimal(str(wallet.balance)),
                'currency': wallet.currency
            }
            accounts.append(account_data)
            
            self.account_summaries[user.id] = {
                'username': user.username,
                'email': user.email,
                'initial_balance': account_data['initial_balance'],
                'total_credits': Decimal('0.00'),
                'total_debits': Decimal('0.00'),
                'transaction_count': 0
            }
            
            print(f"  • {user.username} ({user.email}) - Balance: ${wallet.balance}")
        
        return accounts
    
    def _check_existing_generated_transactions(self) -> bool:
        """Check if generated transactions already exist"""
        existing = Transaction.query.filter(
            Transaction.description.like(f'%{GENERATOR_TAG}%')
        ).count()
        
        if existing > 0:
            print(f"⚠️  Found {existing} existing generated transactions with tag '{GENERATOR_TAG}'")
            return True
        return False
    
    def _generate_transactions(self, accounts: List[Dict]) -> List[Dict]:
        """Generate realistic transactions over 6 months"""
        print(f"\n🔄 Generating transactions...\n")
        
        transactions = []
        start_date = datetime.now() - timedelta(days=MONTHS_BACK * 30)
        end_date = datetime.now() - timedelta(days=1)
        
        # Calculate total transactions needed
        total_weeks = (end_date - start_date).days / 7
        total_transactions = int(total_weeks * TRANSACTIONS_PER_WEEK)
        
        print(f"  Target: ~{total_transactions} transactions over {int(total_weeks)} weeks")
        print(f"  Period: {start_date.date()} to {end_date.date()}\n")
        
        # Generate random timestamps
        timestamps = self._generate_timestamps(start_date, end_date, total_transactions)
        
        # Process chronologically to maintain balance consistency
        timestamps.sort()
        
        for timestamp in timestamps:
            # Decide transaction type
            tx_type = random.choices(
                ['transfer', 'income', 'expense'],
                weights=[0.4, 0.3, 0.3]
            )[0]
            
            if tx_type == 'transfer':
                tx = self._generate_transfer(accounts, timestamp)
            elif tx_type == 'income':
                tx = self._generate_income(accounts, timestamp)
            else:
                tx = self._generate_expense(accounts, timestamp)
            
            if tx:
                transactions.append(tx)
                self.generated_transactions.append(tx)
        
        print(f"  ✓ Generated {len(transactions)} transactions")
        print(f"  ✓ Skipped {len(self.skipped_items)} transactions (would cause negative balance)")
        
        return transactions
    
    def _generate_timestamps(self, start: datetime, end: datetime, count: int) -> List[datetime]:
        """Generate random timestamps spread across the period"""
        timestamps = []
        total_seconds = int((end - start).total_seconds())
        
        for _ in range(count):
            random_seconds = random.randint(0, total_seconds)
            timestamp = start + timedelta(seconds=random_seconds)
            
            # Set realistic time (8 AM to 11 PM)
            hour = random.randint(8, 23)
            minute = random.randint(0, 59)
            second = random.randint(0, 59)
            
            timestamp = timestamp.replace(hour=hour, minute=minute, second=second)
            timestamps.append(timestamp)
        
        return timestamps
    
    def _generate_amount(self) -> Decimal:
        """Generate realistic transaction amount"""
        if random.random() < LARGE_AMOUNT_PROBABILITY:
            # Occasional large transaction
            amount = Decimal(str(round(random.uniform(float(MAX_AMOUNT), float(LARGE_AMOUNT_MAX)), 2)))
        else:
            # Regular transaction
            amount = Decimal(str(round(random.uniform(float(MIN_AMOUNT), float(MAX_AMOUNT)), 2)))
        
        return amount
    
    def _generate_transfer(self, accounts: List[Dict], timestamp: datetime) -> Dict:
        """Generate internal P2P transfer"""
        if len(accounts) < 2:
            return None
        
        sender = random.choice(accounts)
        receiver = random.choice([a for a in accounts if a['user_id'] != sender['user_id']])
        
        amount = self._generate_amount()
        
        # Check if sender has sufficient balance
        if sender['current_balance'] < amount:
            self.skipped_items.append({
                'reason': 'insufficient_balance',
                'sender': sender['username'],
                'amount': float(amount),
                'timestamp': timestamp
            })
            return None
        
        # Update balances
        sender['current_balance'] -= amount
        receiver['current_balance'] += amount
        
        # Update summaries
        self.account_summaries[sender['user_id']]['total_debits'] += amount
        self.account_summaries[sender['user_id']]['transaction_count'] += 1
        self.account_summaries[receiver['user_id']]['total_credits'] += amount
        self.account_summaries[receiver['user_id']]['transaction_count'] += 1
        
        return {
            'user_id': sender['user_id'],
            'sender_id': sender['user_id'],
            'receiver_id': receiver['user_id'],
            'transaction_type': 'transfer',
            'amount': amount,
            'currency': sender['currency'],
            'status': 'completed',
            'description': f"Transfer to {receiver['username']} [{GENERATOR_TAG}]",
            'created_at': timestamp
        }
    
    def _generate_income(self, accounts: List[Dict], timestamp: datetime) -> Dict:
        """Generate external income transaction"""
        account = random.choice(accounts)
        amount = self._generate_amount()
        description = random.choice(TRANSACTION_DESCRIPTIONS['income'])
        
        # Update balance
        account['current_balance'] += amount
        
        # Update summary
        self.account_summaries[account['user_id']]['total_credits'] += amount
        self.account_summaries[account['user_id']]['transaction_count'] += 1
        
        return {
            'user_id': account['user_id'],
            'transaction_type': 'income',
            'amount': amount,
            'currency': account['currency'],
            'status': 'completed',
            'description': f"{description} [{GENERATOR_TAG}]",
            'created_at': timestamp
        }
    
    def _generate_expense(self, accounts: List[Dict], timestamp: datetime) -> Dict:
        """Generate external expense transaction"""
        account = random.choice(accounts)
        amount = self._generate_amount()
        description = random.choice(TRANSACTION_DESCRIPTIONS['expense'])
        
        # Check if account has sufficient balance
        if account['current_balance'] < amount:
            self.skipped_items.append({
                'reason': 'insufficient_balance',
                'account': account['username'],
                'amount': float(amount),
                'timestamp': timestamp
            })
            return None
        
        # Update balance
        account['current_balance'] -= amount
        
        # Update summary
        self.account_summaries[account['user_id']]['total_debits'] += amount
        self.account_summaries[account['user_id']]['transaction_count'] += 1
        
        return {
            'user_id': account['user_id'],
            'transaction_type': 'payment',
            'amount': amount,
            'currency': account['currency'],
            'status': 'completed',
            'description': f"{description} [{GENERATOR_TAG}]",
            'created_at': timestamp
        }
    
    def _insert_transactions(self, transactions: List[Dict]):
        """Insert transactions into database and update balances"""
        print(f"\n💾 Inserting {len(transactions)} transactions...\n")
        
        # Sort by timestamp to maintain chronological order
        transactions.sort(key=lambda x: x['created_at'])
        
        inserted_count = 0
        for tx_data in transactions:
            try:
                # Create transaction
                transaction = Transaction(
                    user_id=tx_data['user_id'],
                    sender_id=tx_data.get('sender_id'),
                    receiver_id=tx_data.get('receiver_id'),
                    transaction_type=tx_data['transaction_type'],
                    amount=tx_data['amount'],
                    currency=tx_data['currency'],
                    status=tx_data['status'],
                    description=tx_data['description'],
                    created_at=tx_data['created_at']
                )
                
                db.session.add(transaction)
                inserted_count += 1
                
                if inserted_count % 100 == 0:
                    db.session.commit()
                    print(f"  ✓ Inserted {inserted_count} transactions...")
            
            except Exception as e:
                print(f"  ❌ Error inserting transaction: {e}")
                db.session.rollback()
        
        # Final commit
        db.session.commit()
        print(f"\n  ✓ Total inserted: {inserted_count} transactions")
        print(f"  ℹ️  Wallet balances NOT updated (historical transactions only)")
    
    def _generate_reports(self):
        """Generate CSV export and summary reports"""
        print(f"\n📊 Generating reports...\n")
        
        # Create reports directory
        reports_dir = os.path.join(os.path.dirname(__file__), 'transaction_reports')
        os.makedirs(reports_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # 1. CSV Export
        csv_path = os.path.join(reports_dir, f'transactions_{timestamp}.csv')
        with open(csv_path, 'w', newline='') as csvfile:
            fieldnames = ['transaction_id', 'date_time', 'debit_account', 'credit_account', 
                         'amount', 'currency', 'type', 'description', 'generator_tag']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            
            for i, tx in enumerate(self.generated_transactions, 1):
                writer.writerow({
                    'transaction_id': f"GEN_{timestamp}_{i:05d}",
                    'date_time': tx['created_at'].isoformat(),
                    'debit_account': tx.get('user_id') if tx['transaction_type'] in ['transfer', 'payment'] else 'external',
                    'credit_account': tx.get('receiver_id', tx.get('user_id')) if tx['transaction_type'] in ['income', 'topup', 'transfer'] else 'external',
                    'amount': float(tx['amount']),
                    'currency': tx['currency'],
                    'type': tx['transaction_type'],
                    'description': tx['description'],
                    'generator_tag': GENERATOR_TAG
                })
        
        print(f"  ✓ CSV export saved: {csv_path}")
        
        # 2. Account Summary
        summary_path = os.path.join(reports_dir, f'account_summary_{timestamp}.json')
        with open(summary_path, 'w') as f:
            summary_data = {
                account_id: {
                    'username': data['username'],
                    'email': data['email'],
                    'initial_balance': float(data['initial_balance']),
                    'total_credits': float(data['total_credits']),
                    'total_debits': float(data['total_debits']),
                    'final_balance': float(data['initial_balance'] + data['total_credits'] - data['total_debits']),
                    'transaction_count': data['transaction_count']
                }
                for account_id, data in self.account_summaries.items()
            }
            json.dump(summary_data, f, indent=2)
        
        print(f"  ✓ Account summary saved: {summary_path}")
        
        # 3. Human-readable summary
        summary_text_path = os.path.join(reports_dir, f'summary_{timestamp}.txt')
        with open(summary_text_path, 'w') as f:
            f.write("="*70 + "\n")
            f.write("UniPay Transaction History Generation Summary\n")
            f.write("="*70 + "\n\n")
            f.write(f"Generation Date: {datetime.now().isoformat()}\n")
            f.write(f"Generator Tag: {GENERATOR_TAG}\n")
            f.write(f"Mode: {'DRY RUN' if self.dry_run else 'LIVE'}\n\n")
            
            f.write(f"Total Transactions Created: {len(self.generated_transactions)}\n")
            f.write(f"Total Accounts Affected: {len(self.account_summaries)}\n")
            f.write(f"Skipped Items: {len(self.skipped_items)}\n\n")
            
            f.write("Per-Account Summary:\n")
            f.write("-" * 70 + "\n")
            for account_id, data in self.account_summaries.items():
                f.write(f"\n{data['username']} ({data['email']}):\n")
                f.write(f"  Initial Balance: ${data['initial_balance']:.2f}\n")
                f.write(f"  Total Credits:   +${data['total_credits']:.2f}\n")
                f.write(f"  Total Debits:    -${data['total_debits']:.2f}\n")
                f.write(f"  Final Balance:   ${data['initial_balance'] + data['total_credits'] - data['total_debits']:.2f}\n")
                f.write(f"  Transactions:    {data['transaction_count']}\n")
            
            if self.skipped_items:
                f.write("\n\nSkipped Items:\n")
                f.write("-" * 70 + "\n")
                for item in self.skipped_items[:10]:
                    f.write(f"  • {item['reason']}: {item.get('sender', item.get('account'))} - ${item['amount']:.2f}\n")
        
        print(f"  ✓ Summary report saved: {summary_text_path}")
        
        # Print summary to console
        print(f"\n{'='*70}")
        print("SUMMARY")
        print(f"{'='*70}")
        print(f"Total Transactions: {len(self.generated_transactions)}")
        print(f"Accounts Affected: {len(self.account_summaries)}")
        print(f"Skipped Items: {len(self.skipped_items)}")
        print(f"\nReports saved to: {reports_dir}/")


def create_cleanup_script():
    """Create a script to remove generated transactions"""
    script_path = os.path.join(os.path.dirname(__file__), 'cleanup_generated_transactions.py')
    
    with open(script_path, 'w') as f:
        f.write(f"""#!/usr/bin/env python3
\"\"\"
Cleanup script to remove generated historical transactions
\"\"\"

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from app import create_app, db
from app.models.transaction import Transaction

GENERATOR_TAG = "{GENERATOR_TAG}"

def cleanup():
    app = create_app()
    
    with app.app_context():
        print(f"\\nSearching for transactions with tag: {{GENERATOR_TAG}}...")
        
        transactions = Transaction.query.filter(
            Transaction.description.like(f'%{{GENERATOR_TAG}}%')
        ).all()
        
        print(f"Found {{len(transactions)}} generated transactions.\\n")
        
        if not transactions:
            print("No transactions to clean up.")
            return
        
        response = input(f"Delete {{len(transactions)}} transactions? (yes/no): ")
        
        if response.lower() == 'yes':
            for tx in transactions:
                db.session.delete(tx)
            
            db.session.commit()
            print(f"\\n✅ Deleted {{len(transactions)}} transactions.")
            print("\\n⚠️  Note: Wallet balances were NOT recalculated. Run balance recalculation if needed.")
        else:
            print("Cleanup aborted.")

if __name__ == '__main__':
    cleanup()
""")
    
    os.chmod(script_path, 0o755)
    print(f"\n✅ Cleanup script created: {script_path}")


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Generate historical transaction data')
    parser.add_argument('--dry-run', action='store_true', help='Run without making changes')
    parser.add_argument('--live', action='store_true', help='Run in live mode (writes to database)')
    parser.add_argument('--auto-confirm', action='store_true', help='Auto-confirm all prompts')
    
    args = parser.parse_args()
    
    if not args.dry_run and not args.live:
        print("\n⚠️  You must specify either --dry-run or --live mode")
        print("Usage:")
        print("  python generate_transaction_history.py --dry-run  # Test without changes")
        print("  python generate_transaction_history.py --live     # Write to database")
        sys.exit(1)
    
    if args.live and not args.auto_confirm:
        print("\n" + "!"*70)
        print("⚠️  LIVE MODE - This will modify the database!")
        print("!"*70)
        response = input("\nType 'CONFIRM' to proceed: ")
        
        if response != 'CONFIRM':
            print("Aborted.")
            sys.exit(1)
    
    generator = TransactionGenerator(dry_run=args.dry_run, auto_confirm=args.auto_confirm)
    generator.run()
    
    if args.live:
        create_cleanup_script()

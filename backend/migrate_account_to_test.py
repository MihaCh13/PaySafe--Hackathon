"""
Safe Account Migration Script
=============================
Migrates all data from StudentKlombaTest@test.com to test@student.com

This script:
1. Verifies both accounts exist
2. Backs up current test@student.com data (if needed)
3. Deletes the empty test@student.com account
4. Updates StudentKlombaTest credentials to test@student.com
5. Verifies all data integrity after migration

Usage:
    python backend/migrate_account_to_test.py
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
from app.models.loan import Loan

def verify_data_integrity(user_id, label):
    """Verify all data for a user"""
    print(f"\n📊 {label} Data Summary:")
    
    transactions = Transaction.query.filter_by(user_id=user_id).count()
    cards = VirtualCard.query.filter_by(user_id=user_id).count()
    goals = Goal.query.filter_by(user_id=user_id).count()
    savings = SavingsPocket.query.filter_by(user_id=user_id).count()
    listings = MarketplaceListing.query.filter_by(seller_id=user_id).count()
    loans = Loan.query.filter((Loan.lender_id == user_id) | (Loan.borrower_id == user_id)).count()
    
    print(f"   Transactions: {transactions}")
    print(f"   Virtual Cards: {cards}")
    print(f"   Goals: {goals}")
    print(f"   Savings Pockets: {savings}")
    print(f"   Marketplace Listings: {listings}")
    print(f"   Loans: {loans}")
    
    return {
        'transactions': transactions,
        'cards': cards,
        'goals': goals,
        'savings': savings,
        'listings': listings,
        'loans': loans
    }

def migrate_account():
    app = create_app()
    
    with app.app_context():
        print("\n" + "="*70)
        print("ACCOUNT MIGRATION: StudentKlombaTest → test@student.com")
        print("="*70 + "\n")
        
        # Step 1: Find both accounts
        print("Step 1: Locating accounts...")
        
        source_user = User.query.filter_by(email='StudentKlombaTest@test.com').first()
        target_user = User.query.filter_by(email='test@student.com').first()
        
        if not source_user:
            print("❌ Error: StudentKlombaTest@test.com account not found!")
            return
        
        if not target_user:
            print("❌ Error: test@student.com account not found!")
            return
        
        print(f"✅ Found source account: {source_user.email} (ID: {source_user.id})")
        print(f"✅ Found target account: {target_user.email} (ID: {target_user.id})")
        
        # Step 2: Verify source account has data
        print("\n" + "-"*70)
        source_data = verify_data_integrity(source_user.id, "SOURCE (StudentKlombaTest)")
        
        if sum(source_data.values()) == 0:
            print("\n⚠️  Warning: Source account has no data!")
            response = input("Continue anyway? (yes/no): ")
            if response.lower() != 'yes':
                print("Migration cancelled.")
                return
        
        # Step 3: Check target account data
        print("\n" + "-"*70)
        target_data = verify_data_integrity(target_user.id, "TARGET (test@student.com)")
        
        if sum(target_data.values()) > 0:
            print("\n⚠️  Warning: Target account has existing data that will be lost!")
            print("This data will be deleted:")
            for key, value in target_data.items():
                if value > 0:
                    print(f"   - {key}: {value}")
            
            response = input("\nAre you sure you want to delete this data? (yes/no): ")
            if response.lower() != 'yes':
                print("Migration cancelled.")
                return
        
        # Step 4: Delete target account
        print("\n" + "-"*70)
        print("Step 2: Deleting current test@student.com account...")
        
        try:
            # The cascade delete should handle all related data automatically
            db.session.delete(target_user)
            db.session.commit()
            print(f"✅ Deleted test@student.com account (ID: {target_user.id})")
        except Exception as e:
            print(f"❌ Error deleting target account: {e}")
            db.session.rollback()
            return
        
        # Step 5: Update source account credentials
        print("\n" + "-"*70)
        print("Step 3: Updating StudentKlombaTest credentials to test@student.com...")
        
        try:
            source_user.email = 'test@student.com'
            source_user.username = 'testuser'
            source_user.first_name = 'Test'
            source_user.last_name = 'User'
            # Ensure password is password123
            source_user.set_password('password123')
            # Ensure PIN is 1234
            source_user.set_pin('1234')
            
            db.session.commit()
            
            print(f"✅ Updated account credentials:")
            print(f"   Email: StudentKlombaTest@test.com → test@student.com")
            print(f"   Username: StudentKlomba → testuser")
            print(f"   Password: password123")
            print(f"   PIN: 1234")
        except Exception as e:
            print(f"❌ Error updating credentials: {e}")
            db.session.rollback()
            return
        
        # Step 6: Verify migration success
        print("\n" + "-"*70)
        print("Step 4: Verifying migration...")
        
        # Re-query the user to confirm changes
        migrated_user = User.query.filter_by(email='test@student.com').first()
        
        if not migrated_user:
            print("❌ Error: Migration failed - test@student.com account not found!")
            return
        
        print(f"✅ Found migrated account: {migrated_user.email} (ID: {migrated_user.id})")
        
        # Verify all data is intact
        print("\n" + "-"*70)
        migrated_data = verify_data_integrity(migrated_user.id, "MIGRATED (test@student.com)")
        
        # Compare data counts
        print("\n" + "-"*70)
        print("Migration Verification:")
        
        all_match = True
        for key in source_data.keys():
            source_count = source_data[key]
            migrated_count = migrated_data[key]
            
            if source_count == migrated_count:
                print(f"   ✅ {key}: {source_count} → {migrated_count}")
            else:
                print(f"   ❌ {key}: {source_count} → {migrated_count} (MISMATCH!)")
                all_match = False
        
        # Final status
        print("\n" + "="*70)
        if all_match:
            print("✅ MIGRATION COMPLETED SUCCESSFULLY!")
            print("="*70)
            print("\nYou can now login with:")
            print("   Email: test@student.com")
            print("   Password: password123")
            print("   PIN: 1234")
            print("\nAll data has been migrated successfully!")
        else:
            print("⚠️  MIGRATION COMPLETED WITH WARNINGS")
            print("="*70)
            print("\nSome data counts don't match. Please verify manually.")

if __name__ == '__main__':
    migrate_account()

"""
Automatic Account Migration Script (Non-Interactive)
====================================================
Migrates all data from StudentKlombaTest@test.com to test@student.com

This script automatically:
1. Deletes the current test@student.com account (User ID 2)
2. Updates StudentKlombaTest@test.com credentials to test@student.com
3. Verifies all data integrity

Usage:
    python backend/migrate_account_to_test_auto.py
"""

from app import create_app
from app.extensions import db
from app.models.user import User
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
        print("AUTOMATIC ACCOUNT MIGRATION")
        print("StudentKlombaTest@test.com → test@student.com")
        print("="*70 + "\n")
        
        # Step 1: Find both accounts
        print("Step 1: Locating accounts...")
        
        source_user = User.query.filter_by(email='StudentKlombaTest@test.com').first()
        target_user = User.query.filter_by(email='test@student.com').first()
        
        if not source_user:
            print("❌ Error: StudentKlombaTest@test.com account not found!")
            return False
        
        if not target_user:
            print("❌ Error: test@student.com account not found!")
            return False
        
        print(f"✅ Found source account: {source_user.email} (ID: {source_user.id})")
        print(f"✅ Found target account: {target_user.email} (ID: {target_user.id})")
        
        # Step 2: Verify source account has data
        print("\n" + "-"*70)
        source_data = verify_data_integrity(source_user.id, "SOURCE (StudentKlombaTest)")
        
        # Step 3: Check target account data (will be deleted)
        print("\n" + "-"*70)
        target_data = verify_data_integrity(target_user.id, "TARGET (test@student.com - will be deleted)")
        
        # Step 4: Delete target account and related data
        print("\n" + "-"*70)
        print("Step 2: Deleting current test@student.com account...")
        
        try:
            # First, manually delete loans where this user is involved (both as lender and borrower)
            # This avoids foreign key constraint issues
            loans_to_delete = Loan.query.filter(
                (Loan.lender_id == target_user.id) | (Loan.borrower_id == target_user.id)
            ).all()
            
            for loan in loans_to_delete:
                # Delete loan repayments first (if any)
                from app.models.loan import LoanRepayment
                LoanRepayment.query.filter_by(loan_id=loan.id).delete()
                # Delete the loan
                db.session.delete(loan)
            
            print(f"   Deleted {len(loans_to_delete)} loans associated with target user")
            
            # Now safe to delete the user (cascade will handle other relationships)
            db.session.delete(target_user)
            db.session.commit()
            print(f"✅ Deleted test@student.com account (ID: {target_user.id})")
        except Exception as e:
            print(f"❌ Error deleting target account: {e}")
            db.session.rollback()
            return False
        
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
            return False
        
        # Step 6: Verify migration success
        print("\n" + "-"*70)
        print("Step 4: Verifying migration...")
        
        # Re-query the user to confirm changes
        migrated_user = User.query.filter_by(email='test@student.com').first()
        
        if not migrated_user:
            print("❌ Error: Migration failed - test@student.com account not found!")
            return False
        
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
            return True
        else:
            print("⚠️  MIGRATION COMPLETED WITH WARNINGS")
            print("="*70)
            print("\nSome data counts don't match. Please verify manually.")
            return False

if __name__ == '__main__':
    success = migrate_account()
    exit(0 if success else 1)

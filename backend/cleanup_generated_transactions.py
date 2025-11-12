#!/usr/bin/env python3
"""
Cleanup script to remove generated historical transactions
"""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from app import create_app, db
from app.models.transaction import Transaction

GENERATOR_TAG = "HISTORICAL_GEN_2025"

def cleanup():
    app = create_app()
    
    with app.app_context():
        print(f"\nSearching for transactions with tag: {GENERATOR_TAG}...")
        
        transactions = Transaction.query.filter(
            Transaction.description.like(f'%{GENERATOR_TAG}%')
        ).all()
        
        print(f"Found {len(transactions)} generated transactions.\n")
        
        if not transactions:
            print("No transactions to clean up.")
            return
        
        response = input(f"Delete {len(transactions)} transactions? (yes/no): ")
        
        if response.lower() == 'yes':
            for tx in transactions:
                db.session.delete(tx)
            
            db.session.commit()
            print(f"\n✅ Deleted {len(transactions)} transactions.")
            print("\n⚠️  Note: Wallet balances were NOT recalculated. Run balance recalculation if needed.")
        else:
            print("Cleanup aborted.")

if __name__ == '__main__':
    cleanup()

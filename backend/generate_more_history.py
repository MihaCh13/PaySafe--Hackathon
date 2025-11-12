#!/usr/bin/env python3
"""
Wrapper script to generate additional historical transactions without manual confirmation
"""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from generate_transaction_history import TransactionGenerator, create_cleanup_script

if __name__ == '__main__':
    print("\n" + "="*70)
    print("Generating Additional Historical Transactions")
    print("="*70)
    print("This will ADD more transactions to the existing historical data.")
    print("="*70 + "\n")
    
    generator = TransactionGenerator(dry_run=False)
    generator.run()
    
    # Update cleanup script
    create_cleanup_script()
    
    print("\n✅ Additional transactions generated successfully!")
    print("📁 Check backend/transaction_reports/ for updated reports\n")

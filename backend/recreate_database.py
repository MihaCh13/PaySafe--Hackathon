#!/usr/bin/env python3
"""
Script to recreate the entire UniPay database from scratch
Usage: python recreate_database.py
"""
from app import create_app
from app.extensions import db
import sys

def recreate_database():
    """Drop all tables and recreate them"""
    
    app = create_app()
    
    with app.app_context():
        print("🗑️  Dropping all existing tables...")
        db.drop_all()
        print("✅ All tables dropped")
        
        print("\n🔨 Creating all tables from models...")
        db.create_all()
        print("✅ All tables created successfully!")
        
        # List all created tables
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        
        print(f"\n📊 Created {len(tables)} tables:")
        for table in sorted(tables):
            print(f"   - {table}")
        
        print("\n✅ Database recreation complete!")
        print("\n💡 Next step: Run 'flask db stamp head' to sync migrations")
        
        return True

if __name__ == "__main__":
    try:
        recreate_database()
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error recreating database: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

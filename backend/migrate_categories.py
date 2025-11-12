from app import create_app
from app.extensions import db
from app.models.merchant import Merchant

def migrate_categories():
    """
    Migrate existing merchant categories to new category names
    
    Old -> New mappings:
    - Food -> Food and drink
    - Retail -> Shopping
    - Sports -> Sport
    - Education -> Study
    - Transport -> Travel
    - Entertainment (City Museum) -> Culture (specific merchant)
    """
    app = create_app()
    
    with app.app_context():
        category_mapping = {
            'Food': 'Food and drink',
            'Retail': 'Shopping',
            'Sports': 'Sport',
            'Education': 'Study',
            'Transport': 'Travel'
        }
        
        updated_count = 0
        
        for old_category, new_category in category_mapping.items():
            merchants = Merchant.query.filter_by(category=old_category).all()
            for merchant in merchants:
                merchant.category = new_category
                updated_count += 1
                print(f"Updated {merchant.name}: {old_category} -> {new_category}")
        
        city_museum = Merchant.query.filter_by(name='City Museum', category='Entertainment').first()
        if city_museum:
            city_museum.category = 'Culture'
            updated_count += 1
            print(f"Updated City Museum: Entertainment -> Culture")
        
        db.session.commit()
        print(f"\n✅ Successfully migrated {updated_count} merchant categories!")

if __name__ == '__main__':
    migrate_categories()

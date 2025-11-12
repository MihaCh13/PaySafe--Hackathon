"""merge_budget_and_virtual_cards

Revision ID: 262ef91e4943
Revises: a8ec3f92db19
Create Date: 2025-11-08 12:52:46.705123

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '262ef91e4943'
down_revision = 'a8ec3f92db19'
branch_labels = None
depends_on = None


def upgrade():
    # Add card_purpose to distinguish between 'payment' and 'budget' cards
    op.add_column('virtual_cards', sa.Column('card_purpose', sa.String(20), nullable=True, server_default='payment'))
    
    # Add budget tracking fields
    op.add_column('virtual_cards', sa.Column('category', sa.String(50), nullable=True))
    op.add_column('virtual_cards', sa.Column('color', sa.String(7), nullable=True, server_default='#6366f1'))
    op.add_column('virtual_cards', sa.Column('icon', sa.String(50), nullable=True, server_default='💳'))
    op.add_column('virtual_cards', sa.Column('allocated_amount', sa.Numeric(10, 2), nullable=True, server_default='0.00'))
    op.add_column('virtual_cards', sa.Column('spent_amount', sa.Numeric(10, 2), nullable=True, server_default='0.00'))
    op.add_column('virtual_cards', sa.Column('monthly_limit', sa.Numeric(10, 2), nullable=True))
    op.add_column('virtual_cards', sa.Column('auto_allocate', sa.Boolean(), nullable=True, server_default='false'))
    op.add_column('virtual_cards', sa.Column('auto_allocate_amount', sa.Numeric(10, 2), nullable=True))
    op.add_column('virtual_cards', sa.Column('updated_at', sa.DateTime(), nullable=True))
    op.add_column('virtual_cards', sa.Column('last_reset_at', sa.DateTime(), nullable=True))
    
    # Make card_number and cvv nullable for budget cards
    op.alter_column('virtual_cards', 'card_number', nullable=True)
    op.alter_column('virtual_cards', 'cvv', nullable=True)


def downgrade():
    # Check if any budget cards exist
    conn = op.get_bind()
    result = conn.execute(sa.text("SELECT COUNT(*) FROM virtual_cards WHERE card_purpose = 'budget'"))
    budget_card_count = result.scalar()
    
    if budget_card_count > 0:
        raise Exception(
            f"\n{'='*80}\n"
            f"MIGRATION DOWNGRADE BLOCKED: {budget_card_count} budget card(s) exist.\n"
            f"{'='*80}\n\n"
            f"This migration unified 'payment cards' and 'budget cards' into the virtual_cards table.\n"
            f"Rolling back would delete all budget cards and their associated data.\n\n"
            f"To proceed with the downgrade, you must first:\n"
            f"1. Manually back up budget card data if needed\n"
            f"2. Delete all budget cards: DELETE FROM virtual_cards WHERE card_purpose = 'budget'\n"
            f"3. Re-run the downgrade migration\n\n"
            f"WARNING: This will permanently delete budget cards. Ensure you have backups.\n"
            f"{'='*80}\n"
        )
    
    # Remove budget tracking fields
    op.drop_column('virtual_cards', 'last_reset_at')
    op.drop_column('virtual_cards', 'updated_at')
    op.drop_column('virtual_cards', 'auto_allocate_amount')
    op.drop_column('virtual_cards', 'auto_allocate')
    op.drop_column('virtual_cards', 'monthly_limit')
    op.drop_column('virtual_cards', 'spent_amount')
    op.drop_column('virtual_cards', 'allocated_amount')
    op.drop_column('virtual_cards', 'icon')
    op.drop_column('virtual_cards', 'color')
    op.drop_column('virtual_cards', 'category')
    op.drop_column('virtual_cards', 'card_purpose')
    
    # Restore card_number and cvv as not nullable (safe after checking budget cards)
    op.alter_column('virtual_cards', 'card_number', nullable=False)
    op.alter_column('virtual_cards', 'cvv', nullable=False)

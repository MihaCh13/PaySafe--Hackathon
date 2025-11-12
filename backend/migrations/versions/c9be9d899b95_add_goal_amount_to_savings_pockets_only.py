"""Add goal_amount to savings_pockets only

Revision ID: c9be9d899b95
Revises: 262ef91e4943
Create Date: 2025-11-09 06:28:06.133444

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'c9be9d899b95'
down_revision = '262ef91e4943'
branch_labels = None
depends_on = None


def upgrade():
    # Manually edited migration - only add goal_amount column
    with op.batch_alter_table('savings_pockets', schema=None) as batch_op:
        batch_op.add_column(sa.Column('goal_amount', sa.Numeric(precision=10, scale=2), nullable=True, server_default='5000.00'))


def downgrade():
    # Remove goal_amount column only
    with op.batch_alter_table('savings_pockets', schema=None) as batch_op:
        batch_op.drop_column('goal_amount')

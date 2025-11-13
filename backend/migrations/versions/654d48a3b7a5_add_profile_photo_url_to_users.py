"""add_profile_photo_url_to_users

Revision ID: 654d48a3b7a5
Revises: 748f170551f2
Create Date: 2025-11-13 17:00:53.626072

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = '654d48a3b7a5'
down_revision = '748f170551f2'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = inspect(bind)
    if "profile_photo_url" not in [c["name"] for c in inspector.get_columns("users")]:
        op.add_column("users", sa.Column("profile_photo_url", sa.String(length=255), nullable=True))


def downgrade():
    bind = op.get_bind()
    inspector = inspect(bind)
    if "profile_photo_url" in [c["name"] for c in inspector.get_columns("users")]:
        op.drop_column("users", "profile_photo_url")

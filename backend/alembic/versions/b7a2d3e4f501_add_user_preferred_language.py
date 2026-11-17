"""Add preferred_language to users table.

Revision ID: b7a2d3e4f501
Revises: 10de7eff93ca
Create Date: 2026-11-17 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'b7a2d3e4f501'
down_revision: Union[str, None] = '10de7eff93ca'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add preferred_language column with default 'en' to users table."""
    op.add_column(
        'users',
        sa.Column(
            'preferred_language',
            sa.String(length=5),
            nullable=False,
            server_default='en',
        ),
    )


def downgrade() -> None:
    """Drop preferred_language column from users table."""
    op.drop_column('users', 'preferred_language')

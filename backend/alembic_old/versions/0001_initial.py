"""initial

Revision ID: 0001_initial
Revises: 
Create Date: 2026-05-18 00:00:00.000000

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '0001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    # Use SQLAlchemy metadata to create all tables as defined by models
    from app.db.base import Base

    Base.metadata.create_all(bind=bind)


def downgrade():
    bind = op.get_bind()
    from app.db.base import Base

    Base.metadata.drop_all(bind=bind)

"""Add users table, authentication, and ownership foreign keys

Revision ID: c4a9e1b2d3f4
Revises: f0494a3f68ca
Create Date: 2026-11-08 20:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = 'c4a9e1b2d3f4'
down_revision: Union[str, None] = 'f0494a3f68ca'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = set(inspector.get_table_names())

    if 'users' not in existing_tables:
        op.create_table(
            'users',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('full_name', sa.String(length=250), nullable=False),
            sa.Column('email', sa.String(length=250), nullable=False),
            sa.Column('password_hash', sa.String(length=255), nullable=False),
            sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('1')),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('email'),
        )
        op.create_index('ix_users_email', 'users', ['email'], unique=True)
        op.create_index('ix_users_created_at', 'users', ['created_at'], unique=False)

    if 'manuscripts' in existing_tables:
        cols = {c['name'] for c in inspector.get_columns('manuscripts')}
        if 'user_id' not in cols:
            op.add_column('manuscripts', sa.Column('user_id', sa.String(length=36), nullable=True))
            op.create_index('ix_manuscripts_user_id', 'manuscripts', ['user_id'], unique=False)
        if 'description' not in cols:
            op.add_column('manuscripts', sa.Column('description', sa.Text(), nullable=True))
        if 'historical_period' not in cols:
            op.add_column('manuscripts', sa.Column('historical_period', sa.String(length=150), nullable=True))
        if 'region' not in cols:
            op.add_column('manuscripts', sa.Column('region', sa.String(length=150), nullable=True))

    if 'processing_jobs' in existing_tables:
        cols = {c['name'] for c in inspector.get_columns('processing_jobs')}
        if 'user_id' not in cols:
            op.add_column('processing_jobs', sa.Column('user_id', sa.String(length=36), nullable=True))
            op.create_index('ix_processing_jobs_user_id', 'processing_jobs', ['user_id'], unique=False)

    if 'heritage_records' in existing_tables:
        cols = {c['name'] for c in inspector.get_columns('heritage_records')}
        if 'user_id' not in cols:
            op.add_column('heritage_records', sa.Column('user_id', sa.String(length=36), nullable=True))
            op.create_index('ix_heritage_records_user_id', 'heritage_records', ['user_id'], unique=False)
        if 'visibility' not in cols:
            op.add_column('heritage_records', sa.Column('visibility', sa.String(length=50), server_default='PRIVATE', nullable=True))
            op.create_index('ix_heritage_records_visibility', 'heritage_records', ['visibility'], unique=False)

    if 'community_contributions' in existing_tables:
        cols = {c['name'] for c in inspector.get_columns('community_contributions')}
        if 'user_id' not in cols:
            op.add_column('community_contributions', sa.Column('user_id', sa.String(length=36), nullable=True))


def downgrade() -> None:
    op.drop_index('ix_users_created_at', table_name='users')
    op.drop_index('ix_users_email', table_name='users')
    op.drop_table('users')

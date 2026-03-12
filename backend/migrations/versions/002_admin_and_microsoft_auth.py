"""Add admin interface, Microsoft auth, and OneDrive integration.

Revision ID: 002
Revises: 001
Create Date: 2026-03-12
"""
from alembic import op
import sqlalchemy as sa

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade():
    # Make google_id nullable for Microsoft-only users
    op.alter_column("users", "google_id", existing_type=sa.String(256), nullable=True)

    # Add Microsoft auth and admin columns to users
    op.add_column("users", sa.Column("microsoft_id", sa.String(256), unique=True, nullable=True))
    op.add_column("users", sa.Column("auth_provider", sa.String(20), server_default="google", nullable=False))

    # Admin config key-value store
    op.create_table(
        "admin_config",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("key", sa.String(128), unique=True, nullable=False),
        sa.Column("value", sa.Text(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )

    # OneDrive folder tracking
    op.create_table(
        "onedrive_folders",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("folder_id", sa.String(512), nullable=False),
        sa.Column("folder_path", sa.String(1024), nullable=False),
        sa.Column("persona", sa.String(64), nullable=True),
        sa.Column("sync_status", sa.String(20), server_default="pending", nullable=False),
        sa.Column("last_synced_at", sa.DateTime(), nullable=True),
        sa.Column("cached_content", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )


def downgrade():
    op.drop_table("onedrive_folders")
    op.drop_table("admin_config")
    op.drop_column("users", "auth_provider")
    op.drop_column("users", "microsoft_id")
    op.alter_column("users", "google_id", existing_type=sa.String(256), nullable=False)

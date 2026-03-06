"""Initial database schema.

Revision ID: 001
Revises:
Create Date: 2026-03-04
"""
from alembic import op
import sqlalchemy as sa

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("google_id", sa.String(256), unique=True, nullable=False),
        sa.Column("email", sa.String(256), unique=True, nullable=False),
        sa.Column("name", sa.String(256), nullable=False),
        sa.Column("avatar_url", sa.String(512), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("preferences", sa.JSON(), nullable=True),
    )

    op.create_table(
        "chat_sessions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False
        ),
        sa.Column("persona", sa.String(64), nullable=False),
        sa.Column(
            "started_at", sa.DateTime(), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("ended_at", sa.DateTime(), nullable=True),
        sa.Column("feedback", sa.JSON(), nullable=True),
        sa.Column("status", sa.String(20), server_default="active", nullable=False),
    )

    op.create_table(
        "messages",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "session_id",
            sa.Integer(),
            sa.ForeignKey("chat_sessions.id"),
            nullable=False,
        ),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column(
            "timestamp", sa.DateTime(), server_default=sa.func.now(), nullable=False
        ),
    )


def downgrade():
    op.drop_table("messages")
    op.drop_table("chat_sessions")
    op.drop_table("users")

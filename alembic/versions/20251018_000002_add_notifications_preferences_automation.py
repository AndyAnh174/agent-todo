"""add notifications preferences automation

Revision ID: 20251018_000002
Revises: 20251016_000001
Create Date: 2025-10-18 00:00:02

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "20251018_000002"
down_revision = "20251016_000001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create notifications table
    op.create_table(
        "notifications",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=False), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("todo_id", sa.dialects.postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("user_id", sa.dialects.postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("notify_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.Enum("pending", "sent", "failed", "viewed", name="notificationstatus"), nullable=False),
        sa.Column("notification_type", sa.String(20), nullable=False),
        sa.Column("subject", sa.String(255), nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("retry_count", sa.Integer, default=0, nullable=False),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("viewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["todo_id"], ["todos.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
    )

    # Create user_preferences table
    op.create_table(
        "user_preferences",
        sa.Column("user_id", sa.dialects.postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column("default_group_id", sa.dialects.postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("work_hours", sa.JSON, default={"start": "08:00", "end": "17:00"}, nullable=False),
        sa.Column("notification_preferences", sa.JSON, default={"email_enabled": True, "push_enabled": True}, nullable=False),
        sa.Column("language", sa.String(5), default="vi", nullable=False),
        sa.Column("timezone", sa.String(50), default="Asia/Ho_Chi_Minh", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["default_group_id"], ["groups.id"]),
    )

    # Create automation_rules table
    op.create_table(
        "automation_rules",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=False), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", sa.dialects.postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("trigger", sa.String(50), nullable=False),
        sa.Column("conditions", sa.JSON, nullable=False),
        sa.Column("action", sa.JSON, nullable=False),
        sa.Column("is_active", sa.Boolean, default=True, nullable=False),
        sa.Column("priority", sa.Integer, default=5, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
    )

    # Create indexes for performance
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])
    op.create_index("ix_notifications_status", "notifications", ["status"])
    op.create_index("ix_notifications_notify_at", "notifications", ["notify_at"])
    op.create_index("ix_automation_rules_user_id", "automation_rules", ["user_id"])
    op.create_index("ix_automation_rules_trigger", "automation_rules", ["trigger"])
    op.create_index("ix_automation_rules_is_active", "automation_rules", ["is_active"])


def downgrade() -> None:
    # Drop indexes
    op.drop_index("ix_automation_rules_is_active", "automation_rules")
    op.drop_index("ix_automation_rules_trigger", "automation_rules")
    op.drop_index("ix_automation_rules_user_id", "automation_rules")
    op.drop_index("ix_notifications_notify_at", "notifications")
    op.drop_index("ix_notifications_status", "notifications")
    op.drop_index("ix_notifications_user_id", "notifications")
    
    # Drop tables
    op.drop_table("automation_rules")
    op.drop_table("user_preferences")
    op.drop_table("notifications")
    
    # Drop enum
    op.execute("DROP TYPE IF EXISTS notificationstatus")

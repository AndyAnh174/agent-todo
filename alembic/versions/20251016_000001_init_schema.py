"""init schema

Revision ID: 20251016_000001
Revises: 
Create Date: 2025-10-16 00:00:01

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20251016_000001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Enable uuid-ossp extension for uuid_generate_v4()
    op.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";")

    op.create_table(
        "users",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=False), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("full_name", sa.Text(), nullable=True),
        sa.Column("email", sa.Text(), nullable=False, unique=True),
        sa.Column("password", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    op.create_table(
        "groups",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=False), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("name", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    op.create_table(
        "tags",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=False), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("name", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    op.create_table(
        "todos",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=False), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", sa.dialects.postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("group_id", sa.dialects.postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("due_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_completed", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("is_important", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["group_id"], ["groups.id"]),
    )

    op.create_table(
        "todo_tag",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=False), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("todo_id", sa.dialects.postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("tag_id", sa.dialects.postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["todo_id"], ["todos.id"]),
        sa.ForeignKeyConstraint(["tag_id"], ["tags.id"]),
    )


def downgrade() -> None:
    op.drop_table("todo_tag")
    op.drop_table("todos")
    op.drop_table("tags")
    op.drop_table("groups")
    op.drop_table("users")



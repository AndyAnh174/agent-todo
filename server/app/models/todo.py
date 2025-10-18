from datetime import datetime
from typing import List, Optional

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import Base


class Todo(Base):
    __tablename__ = "todos"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        server_default=sa.text("uuid_generate_v4()"),
    )
    user_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id"), nullable=True
    )
    group_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False), ForeignKey("groups.id"), nullable=True
    )
    title: Mapped[str] = mapped_column(sa.Text, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(sa.Text, nullable=True)
    due_time: Mapped[Optional[datetime]] = mapped_column(sa.DateTime(timezone=True), nullable=True)
    is_completed: Mapped[bool] = mapped_column(sa.Boolean, nullable=False, server_default=sa.text("false"))
    is_important: Mapped[bool] = mapped_column(sa.Boolean, nullable=False, server_default=sa.text("false"))
    created_at: Mapped[datetime | None] = mapped_column(
        sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True
    )

    user: Mapped[Optional["User"]] = relationship("User", foreign_keys=[user_id], back_populates="todos")
    # relationships
    group: Mapped[Optional["Group"]] = relationship("Group")
    notifications = relationship("Notification", back_populates="todo")
    
    # Many-to-many relationship with tags through TodoTag
    tags = relationship(
        "Tag",
        secondary="todo_tag",
        primaryjoin="Todo.id == TodoTag.todo_id",
        secondaryjoin="Tag.id == TodoTag.tag_id",
        back_populates="todos"
    )



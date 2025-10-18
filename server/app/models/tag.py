from datetime import datetime
from typing import List

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import Base


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        server_default=sa.text("uuid_generate_v4()"),
    )
    name: Mapped[str | None] = mapped_column(sa.Text, nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(
        sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True
    )
    
    # Many-to-many relationship with todos through TodoTag
    todos = relationship(
        "Todo",
        secondary="todo_tag",
        primaryjoin="Tag.id == TodoTag.tag_id",
        secondaryjoin="Todo.id == TodoTag.todo_id",
        back_populates="tags"
    )



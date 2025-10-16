from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from . import Base


class TodoTag(Base):
    __tablename__ = "todo_tag"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        server_default=sa.text("uuid_generate_v4()"),
    )
    todo_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    tag_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    created_at: Mapped[datetime | None] = mapped_column(
        sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True
    )



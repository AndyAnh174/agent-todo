from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from . import Base


class Group(Base):
    __tablename__ = "groups"

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



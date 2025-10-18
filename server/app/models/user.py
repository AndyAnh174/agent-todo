from datetime import datetime
from typing import List

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        server_default=sa.text("uuid_generate_v4()"),
    )
    full_name: Mapped[str | None] = mapped_column(sa.Text, nullable=True)
    email: Mapped[str] = mapped_column(sa.Text, unique=True, nullable=False)
    password: Mapped[str | None] = mapped_column(sa.Text, nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(
        sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True
    )

    # Relationships
    todos = relationship("Todo", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
    preferences = relationship("UserPreference", back_populates="user", uselist=False)
    automation_rules = relationship("AutomationRule", back_populates="user")



from sqlalchemy import Column, String, ForeignKey, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from . import Base


class UserPreference(Base):
    __tablename__ = "user_preferences"

    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), primary_key=True)
    default_group_id = Column(UUID(as_uuid=False), ForeignKey("groups.id"), nullable=True)
    work_hours = Column(JSON, default={"start": "08:00", "end": "17:00"}, nullable=False)
    notification_preferences = Column(JSON, default={"email_enabled": True, "push_enabled": True}, nullable=False)
    language = Column(String(5), default="vi", nullable=False)
    timezone = Column(String(50), default="Asia/Ho_Chi_Minh", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="preferences")
    default_group = relationship("Group")

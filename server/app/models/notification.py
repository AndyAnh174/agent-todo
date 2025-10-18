from sqlalchemy import Column, String, Text, Integer, DateTime, Boolean, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
import uuid

from . import Base


class NotificationStatus(str, enum.Enum):
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"
    VIEWED = "viewed"


class NotificationType(str, enum.Enum):
    EMAIL = "email"
    PUSH = "push"
    SMS = "sms"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    todo_id = Column(UUID(as_uuid=False), ForeignKey("todos.id"), nullable=True)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    notify_at = Column(DateTime(timezone=True), nullable=False)
    status = Column(Enum(NotificationStatus), default=NotificationStatus.PENDING, nullable=False)
    notification_type = Column(String(20), default=NotificationType.EMAIL, nullable=False)
    subject = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    retry_count = Column(Integer, default=0, nullable=False)
    error_message = Column(Text, nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    viewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="notifications")
    todo = relationship("Todo", back_populates="notifications")

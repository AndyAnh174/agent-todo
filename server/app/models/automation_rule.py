from sqlalchemy import Column, String, Boolean, Integer, DateTime, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from . import Base


class AutomationRule(Base):
    __tablename__ = "automation_rules"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    trigger = Column(String(50), nullable=False)  # on_todo_created, on_tag_added, on_due_date, etc.
    conditions = Column(JSON, nullable=False)
    action = Column(JSON, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    priority = Column(Integer, default=5, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="automation_rules")

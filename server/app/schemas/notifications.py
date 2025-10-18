from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field
from sqlalchemy import Enum

from ..models.notification import NotificationStatus, NotificationType


class NotificationBase(BaseModel):
    todo_id: Optional[UUID] = None
    notify_at: datetime
    notification_type: str = Field(default="email", description="Type of notification")
    subject: str = Field(..., max_length=255)
    content: str = Field(..., description="Notification content")


class NotificationCreate(NotificationBase):
    pass


class NotificationUpdate(BaseModel):
    status: Optional[NotificationStatus] = None
    error_message: Optional[str] = None
    sent_at: Optional[datetime] = None
    viewed_at: Optional[datetime] = None


class NotificationOut(NotificationBase):
    id: UUID
    user_id: UUID
    status: NotificationStatus
    retry_count: int
    error_message: Optional[str] = None
    sent_at: Optional[datetime] = None
    viewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class NotificationView(BaseModel):
    """Schema for marking notification as viewed"""
    viewed_at: datetime = Field(default_factory=datetime.utcnow)

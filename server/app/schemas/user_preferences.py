from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID

from pydantic import BaseModel, Field


class UserPreferenceBase(BaseModel):
    default_group_id: Optional[UUID] = None
    work_hours: Dict[str, str] = Field(
        default={"start": "08:00", "end": "17:00"},
        description="Work hours in HH:MM format"
    )
    notification_preferences: Dict[str, Any] = Field(
        default={"email_enabled": True, "push_enabled": True},
        description="Notification preferences"
    )
    language: str = Field(default="vi", max_length=5, description="Language code")
    timezone: str = Field(default="Asia/Ho_Chi_Minh", max_length=50, description="Timezone")


class UserPreferenceCreate(UserPreferenceBase):
    pass


class UserPreferenceUpdate(BaseModel):
    default_group_id: Optional[UUID] = None
    work_hours: Optional[Dict[str, str]] = None
    notification_preferences: Optional[Dict[str, Any]] = None
    language: Optional[str] = Field(None, max_length=5)
    timezone: Optional[str] = Field(None, max_length=50)


class UserPreferenceOut(UserPreferenceBase):
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

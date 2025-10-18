from datetime import datetime
from typing import Dict, Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class AutomationRuleBase(BaseModel):
    name: str = Field(..., max_length=255, description="Rule name")
    trigger: str = Field(..., max_length=50, description="Trigger event")
    conditions: Dict[str, Any] = Field(..., description="Rule conditions")
    action: Dict[str, Any] = Field(..., description="Rule action")
    is_active: bool = Field(default=True, description="Whether rule is active")
    priority: int = Field(default=5, ge=1, le=10, description="Rule priority (1-10)")


class AutomationRuleCreate(AutomationRuleBase):
    pass


class AutomationRuleUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    trigger: Optional[str] = Field(None, max_length=50)
    conditions: Optional[Dict[str, Any]] = None
    action: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    priority: Optional[int] = Field(None, ge=1, le=10)


class AutomationRuleOut(AutomationRuleBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

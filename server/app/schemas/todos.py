from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class TodoCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_time: Optional[datetime] = None
    group_id: Optional[str] = None
    tag_ids: Optional[List[str]] = None
    is_important: Optional[bool] = False


class TodoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_time: Optional[datetime] = None
    group_id: Optional[str] = None
    tag_ids: Optional[List[str]] = None
    is_important: Optional[bool] = None
    is_completed: Optional[bool] = None


class TodoOut(BaseModel):
    id: str
    title: str
    description: Optional[str]
    due_time: Optional[datetime]
    is_completed: bool
    is_important: bool
    user_id: Optional[str]
    group_id: Optional[str]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]


class TodoCompletePatch(BaseModel):
    is_completed: bool



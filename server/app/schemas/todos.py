from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from .tags import TagOut


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
    order_index: Optional[int] = 0
    user_id: Optional[str]
    group_id: Optional[str]
    tags: Optional[List[TagOut]] = []
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class TodoCompletePatch(BaseModel):
    is_completed: bool



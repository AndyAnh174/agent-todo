from datetime import datetime
from pydantic import BaseModel


class GroupCreate(BaseModel):
    name: str


class GroupUpdate(BaseModel):
    name: str


class GroupOut(BaseModel):
    id: str
    name: str | None
    created_at: datetime | None
    updated_at: datetime | None



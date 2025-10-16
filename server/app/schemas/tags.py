from datetime import datetime
from pydantic import BaseModel


class TagCreate(BaseModel):
    name: str


class TagUpdate(BaseModel):
    name: str


class TagOut(BaseModel):
    id: str
    name: str | None
    created_at: datetime | None
    updated_at: datetime | None



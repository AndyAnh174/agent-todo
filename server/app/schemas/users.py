from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    id: str
    full_name: str | None
    email: EmailStr
    created_at: datetime | None
    updated_at: datetime | None


class UserOut(UserBase):
    pass



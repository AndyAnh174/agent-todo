from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .db import get_db
from .models.user import User
from .security import decode_token


def db_session(dep: Session = Depends(get_db)) -> Session:
    return dep


security_bearer = HTTPBearer(auto_error=True)


def get_current_user(
    db: Session = Depends(db_session),
    credentials: HTTPAuthorizationCredentials = Depends(security_bearer),
) -> User:
    try:
        payload = decode_token(credentials.credentials)
        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("invalid sub")
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user



from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..dependencies import db_session
from ..models.user import User
from ..schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from ..security import create_access_token, hash_password, verify_password


router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(db_session)) -> dict:
    exists = db.query(User).filter(User.email == payload.email).first()
    if exists:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        full_name=payload.full_name,
        email=payload.email,
        password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "email": user.email}


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(db_session)) -> TokenResponse:
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not user.password or not verify_password(payload.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(subject=user.id)
    return TokenResponse(access_token=token)



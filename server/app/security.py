from datetime import datetime, timedelta, timezone
from typing import Any, Dict

import jwt
from passlib.hash import pbkdf2_sha256

from .config import settings


def hash_password(plain_password: str) -> str:
    return pbkdf2_sha256.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pbkdf2_sha256.verify(plain_password, hashed_password)


def create_access_token(subject: str, extra_claims: Dict[str, Any] | None = None) -> str:
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=int(settings.jwt_expires_min))
    payload: Dict[str, Any] = {
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        **(extra_claims or {}),
    }
    token = jwt.encode(payload, settings.jwt_secret, algorithm="HS256")
    return token


def decode_token(token: str) -> Dict[str, Any]:
    return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])



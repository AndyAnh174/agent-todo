import os
from dataclasses import dataclass

from dotenv import load_dotenv


@dataclass
class Settings:
    app_env: str = "development"
    app_port: int = 8000
    database_url: str = ""
    jwt_secret: str = "change_me"
    jwt_expires_min: int = 60
    
    # SMTP Configuration
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    
    # Redis Configuration
    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/0"


def load_settings() -> Settings:
    load_dotenv()
    return Settings(
        app_env=os.getenv("APP_ENV", "development"),
        app_port=int(os.getenv("APP_PORT", "8000")),
        database_url=os.getenv("DATABASE_URL", ""),
        jwt_secret=os.getenv("JWT_SECRET", "change_me"),
        jwt_expires_min=int(os.getenv("JWT_EXPIRES_MIN", "60")),
        smtp_host=os.getenv("SMTP_HOST", "smtp.gmail.com"),
        smtp_port=int(os.getenv("SMTP_PORT", "587")),
        smtp_user=os.getenv("SMTP_USER", ""),
        smtp_password=os.getenv("SMTP_PASSWORD", ""),
        smtp_from_email=os.getenv("SMTP_FROM_EMAIL", ""),
        redis_url=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
        celery_broker_url=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0"),
    )


settings = load_settings()



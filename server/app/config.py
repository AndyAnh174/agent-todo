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


def load_settings() -> Settings:
    load_dotenv()
    return Settings(
        app_env=os.getenv("APP_ENV", "development"),
        app_port=int(os.getenv("APP_PORT", "8000")),
        database_url=os.getenv("DATABASE_URL", ""),
        jwt_secret=os.getenv("JWT_SECRET", "change_me"),
        jwt_expires_min=int(os.getenv("JWT_EXPIRES_MIN", "60")),
    )


settings = load_settings()



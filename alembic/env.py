from __future__ import annotations

import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)


def get_target_metadata():
    # Load app settings and models metadata
    from dotenv import load_dotenv

    load_dotenv()
    # ensure /app is on sys.path inside container
    app_dir = os.getenv("APP_WORKDIR", "/app")
    if app_dir not in sys.path:
        sys.path.insert(0, app_dir)
    os.environ.setdefault("APP_ENV", os.getenv("APP_ENV", "development"))

    # import models Base
    sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'server'))
    from app.models import Base  # type: ignore

    return Base.metadata


target_metadata = get_target_metadata()


def get_url() -> str:
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        # fallback to alembic.ini if provided
        database_url = config.get_main_option("sqlalchemy.url")
    if not database_url:
        raise RuntimeError("DATABASE_URL not set for Alembic")
    return database_url


def run_migrations_offline() -> None:
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    configuration = config.get_section(config.config_ini_section) or {}
    configuration["sqlalchemy.url"] = get_url()
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        future=True,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()



from __future__ import annotations

import os
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy import engine_from_config

from alembic import context

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here for 'autogenerate' support
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.base import Base  # noqa: E402
from app.core.config import settings  # noqa: E402

target_metadata = Base.metadata


def _sync_database_url(async_url: str) -> str:
    """Convert async SQLAlchemy URLs to synchronous equivalents for Alembic.

    Examples:
      - postgresql+asyncpg://... -> postgresql://...
      - sqlite+aiosqlite:///./file -> sqlite:///./file
    """
    if async_url.startswith("postgresql+asyncpg://"):
        return async_url.replace("postgresql+asyncpg://", "postgresql://", 1)
    if "+asyncpg" in async_url:
        return async_url.replace("+asyncpg", "")
    if async_url.startswith("sqlite+aiosqlite://"):
        return async_url.replace("sqlite+aiosqlite://", "sqlite://", 1)
    if "+aiosqlite" in async_url:
        return async_url.replace("+aiosqlite", "")
    return async_url


def run_migrations_offline() -> None:
    url = _sync_database_url(settings.database_url)
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    configuration = config.get_section(config.config_ini_section)
    configuration['sqlalchemy.url'] = _sync_database_url(settings.database_url)

    connectable = engine_from_config(configuration, prefix='sqlalchemy.', poolclass=pool.NullPool)

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

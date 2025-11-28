"""Alembic environment configuration for asynchronous PostgreSQL migrations."""

from __future__ import annotations

import asyncio
from logging.config import fileConfig
from typing import Any, Dict

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from app.core.config import settings
from app.db.base import Base

# Alembic Config object, provides access to values within alembic.ini.
config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def get_url() -> str:
    dsn = settings.postgres_dsn
    if dsn is None:
        raise RuntimeError("APP_POSTGRES_DSN must be configured to run migrations.")
    return str(dsn)


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""

    url = get_url()

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def process_revision_directives(context: Any, revision: Any, directives: Any) -> None:
    """Placeholder for hooks (e.g. auto-generating comments)."""
    # Intentionally left blank for future customization.


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""

    connectable: AsyncEngine = create_async_engine(
        get_url(),
        poolclass=pool.NullPool,
    )

    async def _run() -> None:
        async with connectable.connect() as connection:
            await connection.run_sync(do_run_migrations)

        await connectable.dispose()

    asyncio.run(_run())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

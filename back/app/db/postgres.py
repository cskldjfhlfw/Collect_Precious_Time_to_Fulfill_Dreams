from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.sql import text

from app.core.config import settings

engine: Optional[AsyncEngine] = None
session_factory: Optional[async_sessionmaker[AsyncSession]] = None


async def init_postgres() -> None:
    global engine, session_factory

    if not settings.postgres_enabled:
        return

    if not settings.postgres_dsn:
        raise ValueError("PostgreSQL DSN is required when postgres is enabled.")

    if engine is None:
        engine = create_async_engine(str(settings.postgres_dsn), echo=settings.postgres_echo, future=True)
        session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with engine.begin() as connection:
        await connection.execute(text("SELECT 1"))


async def close_postgres() -> None:
    global engine
    if engine is not None:
        await engine.dispose()
        engine = None


@asynccontextmanager
async def lifespan_postgres() -> AsyncGenerator[None, None]:
    await init_postgres()
    try:
        yield
    finally:
        await close_postgres()


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    if not settings.postgres_enabled:
        raise RuntimeError("PostgreSQL connection is disabled.")
    if session_factory is None:
        raise RuntimeError("PostgreSQL session factory is not initialised.")

    session = session_factory()
    try:
        yield session
    finally:
        await session.close()


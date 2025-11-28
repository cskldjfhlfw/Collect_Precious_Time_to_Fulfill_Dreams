"""Database initialization script."""

import asyncio

from sqlalchemy.ext.asyncio import AsyncEngine

from app.db.base import Base
from app.db.postgres import engine
from app.models import *  # noqa: F401,F403


async def init_db() -> None:
    """Initialize database tables."""
    if not engine:
        raise RuntimeError("Database engine not initialized")
    
    async with engine.begin() as conn:
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
        print("Database tables created successfully!")


async def drop_db() -> None:
    """Drop all database tables."""
    if not engine:
        raise RuntimeError("Database engine not initialized")
    
    async with engine.begin() as conn:
        # Drop all tables
        await conn.run_sync(Base.metadata.drop_all)
        print("Database tables dropped successfully!")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "drop":
        asyncio.run(drop_db())
    else:
        asyncio.run(init_db())

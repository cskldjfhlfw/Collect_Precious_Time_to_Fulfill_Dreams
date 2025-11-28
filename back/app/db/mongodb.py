from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import settings

client: Optional[AsyncIOMotorClient] = None


async def init_mongo() -> None:
    global client

    if not settings.mongo_enabled:
        return

    if not settings.mongo_dsn:
        raise ValueError("MongoDB DSN is required when mongo is enabled.")

    client = AsyncIOMotorClient(settings.mongo_dsn)

    await get_database().command("ping")


async def close_mongo() -> None:
    global client
    if client is not None:
        client.close()
        client = None


def get_client() -> AsyncIOMotorClient:
    if not settings.mongo_enabled:
        raise RuntimeError("MongoDB connection is disabled.")
    if client is None:
        raise RuntimeError("MongoDB client is not initialised.")
    return client


def get_database(name: Optional[str] = None) -> AsyncIOMotorDatabase:
    db_name = name or settings.mongo_database
    if not db_name:
        raise ValueError("MongoDB database name must be provided.")
    return get_client()[db_name]


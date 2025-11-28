from typing import Optional

from redis.asyncio import Redis

from app.core.config import settings

redis_client: Optional[Redis] = None


async def init_redis() -> None:
    global redis_client

    if not settings.redis_enabled:
        return

    if not settings.redis_dsn:
        raise ValueError("Redis DSN is required when redis is enabled.")

    # Create Redis client with conditional SSL parameter
    redis_kwargs = {
        "encoding": "utf-8",
        "decode_responses": True,
    }
    
    # Only add SSL parameter if it's True (Redis.from_url doesn't accept ssl=False)
    if settings.redis_ssl:
        redis_kwargs["ssl"] = True
    
    redis_client = Redis.from_url(
        str(settings.redis_dsn),
        **redis_kwargs
    )

    await redis_client.ping()


async def close_redis() -> None:
    global redis_client
    if redis_client is not None:
        await redis_client.close()
        redis_client = None


def get_client() -> Redis:
    if not settings.redis_enabled:
        raise RuntimeError("Redis connection is disabled.")
    if redis_client is None:
        raise RuntimeError("Redis client is not initialised.")
    return redis_client


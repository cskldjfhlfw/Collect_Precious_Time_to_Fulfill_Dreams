from typing import Dict

from fastapi import APIRouter

from app.core.config import settings
from app.db import mongodb, neo4j, postgres, redis

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("/", summary="Health status for external services")
async def get_health_status() -> Dict[str, Dict[str, str]]:
    checks: Dict[str, Dict[str, str]] = {}

    if settings.postgres_enabled:
        try:
            async with postgres.engine.begin() as connection:  # type: ignore[union-attr]
                await connection.execute("SELECT 1")
            checks["postgresql"] = {"status": "ok"}
        except Exception as exc:  # pragma: no cover - guarded runtime behaviour
            checks["postgresql"] = {"status": "error", "detail": str(exc)}
    else:
        checks["postgresql"] = {"status": "disabled"}

    if settings.neo4j_enabled:
        try:
            async with neo4j.driver.session() as session:  # type: ignore[union-attr]
                await session.run("RETURN 1")
            checks["neo4j"] = {"status": "ok"}
        except Exception as exc:  # pragma: no cover
            checks["neo4j"] = {"status": "error", "detail": str(exc)}
    else:
        checks["neo4j"] = {"status": "disabled"}

    if settings.mongo_enabled:
        try:
            await mongodb.get_database().command("ping")
            checks["mongodb"] = {"status": "ok"}
        except Exception as exc:  # pragma: no cover
            checks["mongodb"] = {"status": "error", "detail": str(exc)}
    else:
        checks["mongodb"] = {"status": "disabled"}

    if settings.redis_enabled:
        try:
            client = redis.get_client()
            await client.ping()
            checks["redis"] = {"status": "ok"}
        except Exception as exc:  # pragma: no cover
            checks["redis"] = {"status": "error", "detail": str(exc)}
    else:
        checks["redis"] = {"status": "disabled"}

    return checks


from typing import Optional

from neo4j import AsyncDriver, AsyncGraphDatabase, AsyncManagedTransaction, AsyncSession

from app.core.config import settings

driver: Optional[AsyncDriver] = None


async def init_neo4j() -> None:
    global driver

    if not settings.neo4j_enabled:
        return

    if not all([settings.neo4j_uri, settings.neo4j_user, settings.neo4j_password]):
        raise ValueError("Neo4j URI, user, and password are required when neo4j is enabled.")

    if driver is None:
        driver = AsyncGraphDatabase.driver(
            settings.neo4j_uri,
            auth=(settings.neo4j_user, settings.neo4j_password),
        )

    # 使用指定的数据库进行健康检查
    database = settings.neo4j_database or "neo4j"  # 默认使用 neo4j 数据库
    async with driver.session(database=database) as session:
        await session.execute_read(_health_check)


async def close_neo4j() -> None:
    global driver
    if driver is not None:
        await driver.close()
        driver = None


async def get_session() -> AsyncSession:
    if not settings.neo4j_enabled:
        raise RuntimeError("Neo4j connection is disabled.")
    if driver is None:
        raise RuntimeError("Neo4j driver is not initialised.")
    database = settings.neo4j_database or "neo4j"  # 默认使用 neo4j 数据库
    return driver.session(database=database)


async def _health_check(tx: AsyncManagedTransaction) -> None:
    await tx.run("RETURN 1 AS ok")


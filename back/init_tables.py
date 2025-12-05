"""独立的数据库表初始化脚本"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from app.db.base import Base
from app.models import *  # noqa: F401,F403
from app.core.config import settings


async def init_tables():
    """创建所有数据库表"""
    if not settings.postgres_dsn:
        print("错误: 未配置 PostgreSQL DSN")
        return
    
    engine = create_async_engine(str(settings.postgres_dsn), echo=True)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        print("✅ 数据库表创建成功!")
    
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(init_tables())

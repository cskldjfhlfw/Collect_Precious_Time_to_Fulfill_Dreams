from contextlib import asynccontextmanager
from typing import Dict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import (
    analytics,
    audit_logs,
    auth,
    competitions,
    conferences,
    cooperations,
    dashboard,
    health,
    knowledge_graph,
    notifications,
    paper_documents,
    papers,
    patents,
    projects,
    resources,
    search,
    software_copyrights,
    system,
    users,
)
from app.core.config import settings
from app.core.logging import configure_logging
from app.services.project_cleanup import project_cleanup_service
from app.db.mongodb import close_mongo, init_mongo
from app.db.neo4j import close_neo4j, init_neo4j
from app.db.postgres import close_postgres, init_postgres
from app.db.redis import close_redis, init_redis


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()

    await init_postgres()
    await init_neo4j()
    await init_mongo()
    await init_redis()

    yield

    # 清理所有运行中的项目进程
    try:
        cleanup_results = await project_cleanup_service.cleanup_all_running_projects()
        if cleanup_results:
            print(f"系统关闭：清理了 {len(cleanup_results)} 个项目")
            for result in cleanup_results:
                if result['success']:
                    print(f"  项目 {result['project_id']}: 停止了 {result['process_count']} 个进程")
                else:
                    print(f"  项目 {result['project_id']}: 清理失败 - {result.get('error', '未知错误')}")
    except Exception as e:
        print(f"清理项目进程失败: {str(e)}")

    await close_redis()
    await close_mongo()
    await close_neo4j()
    await close_postgres()


app = FastAPI(
    title=settings.app_name,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_as_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix=settings.api_prefix)
app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(users.router, prefix=settings.api_prefix)
app.include_router(system.router, prefix=settings.api_prefix)
app.include_router(notifications.router, prefix=settings.api_prefix)
app.include_router(dashboard.router, prefix=settings.api_prefix)
app.include_router(analytics.router, prefix=settings.api_prefix)
app.include_router(audit_logs.router, prefix=settings.api_prefix)  # 操作日志
app.include_router(papers.router, prefix=settings.api_prefix)
app.include_router(paper_documents.router, prefix=settings.api_prefix)  # MongoDB论文文档
app.include_router(patents.router, prefix=settings.api_prefix)
app.include_router(projects.router, prefix=settings.api_prefix)
app.include_router(resources.router, prefix=settings.api_prefix)
app.include_router(competitions.router, prefix=settings.api_prefix)
app.include_router(conferences.router, prefix=settings.api_prefix)
app.include_router(cooperations.router, prefix=settings.api_prefix)
app.include_router(software_copyrights.router, prefix=settings.api_prefix)
app.include_router(search.router, prefix=settings.api_prefix)
app.include_router(knowledge_graph.router, prefix=settings.api_prefix)


@app.get("/", tags=["Root"], summary="Root endpoint")
async def root() -> Dict[str, str]:
    return {"message": f"{settings.app_name} is running."}


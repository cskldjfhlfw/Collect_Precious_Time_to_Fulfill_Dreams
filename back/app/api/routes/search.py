import time
from typing import Any, List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.papers import crud_paper
from app.crud.projects import crud_project
from app.crud.patents import crud_patent
from app.crud.resources import crud_resource
from app.db.postgres import get_session
from app.api.deps import get_current_user
from app.models.tables import User
from app.schemas.common import PaginationParams
from app.schemas.search import SearchResponse, SearchResult
from app.services.search_history import search_history_service

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("/", response_model=SearchResponse)
async def global_search(
    q: str = Query(..., description="搜索关键词"),
    type: str = Query("all", description="搜索类型: papers|projects|patents|resources|all"),
    pagination: PaginationParams = Depends(),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
) -> Any:
    """全局搜索功能"""
    start_time = time.time()
    
    # 记录搜索历史到Redis
    await search_history_service.record_search(
        user_id=str(current_user.id),
        keyword=q,
        category=type if type != "all" else None
    )
    
    all_results = []
    
    # 根据搜索类型执行不同的搜索
    if type in ["papers", "all"]:
        papers = await crud_paper.search(db, query=q, skip=0, limit=50)
        for paper in papers:
            all_results.append(SearchResult(
                id=hash(str(paper.id)) % 1000000,  # 简化的ID转换
                title=paper.title,
                type="paper",
                category="papers",
                description=paper.abstract or "论文摘要",
                author=paper.authors.get("first_author", "未知作者") if paper.authors else "未知作者",
                date=paper.publish_date,
                relevance=95,  # 简化的相关性评分
                url=f"/papers/{paper.id}"
            ))
    
    if type in ["projects", "all"]:
        projects = await crud_project.search(db, query=q, skip=0, limit=50)
        for project in projects:
            all_results.append(SearchResult(
                id=hash(str(project.id)) % 1000000,
                title=project.name,
                type="project",
                category="projects",
                description=project.description or "项目描述",
                author=project.principal or "未知负责人",
                date=project.start_date,
                relevance=90,
                url=f"/projects/{project.id}"
            ))
    
    if type in ["patents", "all"]:
        patents = await crud_patent.search(db, query=q, skip=0, limit=50)
        for patent in patents:
            all_results.append(SearchResult(
                id=hash(str(patent.id)) % 1000000,
                title=patent.name,
                type="patent",
                category="patents",
                description="专利描述",
                author=patent.inventors.get("first_inventor", "未知发明人") if patent.inventors else "未知发明人",
                date=patent.application_date,
                relevance=88,
                url=f"/patents/{patent.id}"
            ))
    
    if type in ["resources", "all"]:
        resources = await crud_resource.search(db, query=q, skip=0, limit=50)
        for resource in resources:
            all_results.append(SearchResult(
                id=hash(str(resource.id)) % 1000000,
                title=resource.name,
                type="resource",
                category="resources",
                description=resource.description or "资源描述",
                author=resource.maintainer or "未知维护者",
                date=None,
                relevance=85,
                url=f"/resources/{resource.id}"
            ))
    
    # 按相关性排序
    all_results.sort(key=lambda x: x.relevance, reverse=True)
    
    # 分页处理
    start_idx = pagination.offset
    end_idx = start_idx + pagination.size
    paginated_results = all_results[start_idx:end_idx]
    
    search_time = time.time() - start_time
    
    return SearchResponse(
        results=paginated_results,
        total=len(all_results),
        page=pagination.page,
        size=pagination.size,
        pages=(len(all_results) + pagination.size - 1) // pagination.size,
        query=q,
        search_time=round(search_time, 3)
    )


@router.get("/history/my")
async def get_my_search_history(
    limit: int = Query(10, description="返回数量限制"),
    current_user: User = Depends(get_current_user),
) -> Any:
    """获取当前用户的搜索历史"""
    history = await search_history_service.get_user_history(
        user_id=str(current_user.id),
        limit=limit
    )
    
    return {
        "history": history,
        "count": len(history)
    }


@router.delete("/history/my")
async def clear_my_search_history(
    current_user: User = Depends(get_current_user),
) -> Any:
    """清除当前用户的搜索历史"""
    success = await search_history_service.clear_user_history(
        user_id=str(current_user.id)
    )
    
    return {
        "message": "搜索历史已清除" if success else "清除失败",
        "success": success
    }


@router.get("/hot-keywords")
async def get_hot_keywords(
    limit: int = Query(10, description="返回数量限制"),
    category: str = Query(None, description="分类: papers|projects|patents|resources"),
) -> Any:
    """获取热门搜索关键词"""
    hot_keywords = await search_history_service.get_hot_keywords(
        limit=limit,
        category=category
    )
    
    return {
        "hot_keywords": [
            {"keyword": kw, "count": count}
            for kw, count in hot_keywords
        ],
        "count": len(hot_keywords)
    }


@router.get("/suggestions")
async def get_search_suggestions(
    q: str = Query(..., description="搜索前缀"),
    limit: int = Query(10, description="返回数量限制"),
) -> Any:
    """获取搜索建议（自动补全）"""
    suggestions = await search_history_service.get_search_suggestions(
        prefix=q,
        limit=limit
    )
    
    return {
        "suggestions": suggestions,
        "count": len(suggestions)
    }


@router.get("/trending")
async def get_trending_searches(
    hours: int = Query(24, description="最近多少小时"),
    limit: int = Query(10, description="返回数量限制"),
) -> Any:
    """获取趋势搜索（最近N小时的热搜）"""
    trending = await search_history_service.get_trending_searches(
        hours=hours,
        limit=limit
    )
    
    return {
        "trending": [
            {"keyword": kw, "count": count}
            for kw, count in trending
        ],
        "count": len(trending)
    }

from typing import Any, Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import crud_resource
from app.db.postgres import get_session
from app.api.deps import get_current_admin_user
from app.models.tables import User
from app.services.audit_log import audit_log_service
from app.schemas.common import PaginatedResponse, PaginationParams, StatsResponse
from app.schemas.resources import (
    ResourceCreate,
    ResourceListItem,
    ResourceResponse,
    ResourceUpdate,
    ResourceUsageLogResponse,
)

router = APIRouter(prefix="/resources", tags=["Resources"])


@router.get("/", response_model=PaginatedResponse[ResourceListItem])
async def get_resources(
    pagination: PaginationParams = Depends(),
    resource_type: str = Query(None, description="Filter by resource type"),
    is_public: bool = Query(None, description="Filter by public/private"),
    search: str = Query(None, description="Search keyword"),
    db: AsyncSession = Depends(get_session),
) -> Any:
    """获取资源列表"""
    filters = {}
    if resource_type:
        filters["resource_type"] = resource_type
    if is_public is not None:
        filters["is_public"] = is_public

    # 如果有搜索关键词，优先使用搜索逻辑
    if search:
        resources = await crud_resource.search(
            db,
            query=search,
            skip=pagination.offset,
            limit=pagination.size,
        )
        total = len(resources)
    else:
        resources = await crud_resource.get_multi(
            db, skip=pagination.offset, limit=pagination.size, filters=filters
        )
        total = await crud_resource.count(db, filters=filters)

    items = [
        ResourceListItem(
            id=resource.id,
            name=resource.name,
            resource_type=resource.resource_type,
            version=resource.version,
            maintainer=resource.maintainer,
            download_count=resource.download_count,
            usage_rate=resource.usage_rate,
            next_maintenance_date=resource.next_maintenance_date,
            is_public=resource.is_public,
        )
        for resource in resources
    ]

    return PaginatedResponse(
        items=items,
        total=total,
        page=pagination.page,
        size=pagination.size,
        pages=(total + pagination.size - 1) // pagination.size,
    )


@router.get("/stats")
async def get_resource_stats(db: AsyncSession = Depends(get_session)) -> Any:
    """获取资源统计数据"""
    stats = await crud_resource.get_stats(db)
    
    return {
        "overview": [
            StatsResponse(label="总资源数", value=stats["total"], change="+8", trend="up"),
            StatsResponse(label="公开资源", value=stats["public"], change="+5", trend="up"),
            StatsResponse(label="私有资源", value=stats["private"], change="+3", trend="up"),
            StatsResponse(label="活跃资源", value=stats["active"], change="+2", trend="up"),
        ],
        "by_type": stats["by_type"],
    }


@router.get("/maintenance-due", response_model=list[ResourceResponse])
async def get_maintenance_due(
    days_ahead: int = Query(7, description="Days ahead to check for maintenance"),
    db: AsyncSession = Depends(get_session),
) -> Any:
    """获取需要维护的资源"""
    return await crud_resource.get_maintenance_due(db, days_ahead=days_ahead)


@router.get("/{resource_id}/usage-logs", response_model=list[ResourceUsageLogResponse])
async def get_resource_usage_logs(
    resource_id: UUID,
    pagination: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_session),
) -> Any:
    """获取资源使用记录"""
    return await crud_resource.get_usage_logs(
        db, resource_id=str(resource_id), skip=pagination.offset, limit=pagination.size
    )


@router.post("/{resource_id}/download")
async def download_resource(
    resource_id: UUID,
    db: AsyncSession = Depends(get_session),
) -> Any:
    """下载资源（更新下载计数）"""
    await crud_resource.update_download_count(db, resource_id=str(resource_id))
    return {"message": "Download count updated"}


@router.get("/{resource_id}", response_model=ResourceResponse)
async def get_resource(
    resource_id: UUID,
    db: AsyncSession = Depends(get_session),
) -> Any:
    """获取资源详情"""
    resource = await crud_resource.get(db, resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    return resource


@router.post("/", response_model=ResourceResponse)
async def create_resource(
    resource_in: ResourceCreate,
    request: Request,
    current_user: Annotated[User, Depends(get_current_admin_user)],
    db: AsyncSession = Depends(get_session),
) -> Any:
    """创建资源"""
    try:
        resource = await crud_resource.create(db, obj_in=resource_in)
        
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="create",
            resource_type="resource",
            resource_id=str(resource.id),
            changes={"after": {"name": resource.name, "resource_type": resource.resource_type}},
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            status="success"
        )
        
        return resource
    except Exception as e:
        import logging
        logging.error(f"创建资源失败: {str(e)}, 输入数据: {resource_in}")
        
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="create",
            resource_type="resource",
            status="failed",
            error_message=str(e),
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        
        raise HTTPException(status_code=400, detail=f"创建资源失败: {str(e)}")


@router.put("/{resource_id}", response_model=ResourceResponse)
async def update_resource(
    resource_id: UUID,
    resource_in: ResourceUpdate,
    request: Request,
    current_user: Annotated[User, Depends(get_current_admin_user)],
    db: AsyncSession = Depends(get_session),
) -> Any:
    """更新资源"""
    resource = await crud_resource.get(db, resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    try:
        old_data = {"name": resource.name, "resource_type": resource.resource_type}
        updated_resource = await crud_resource.update(db, db_obj=resource, obj_in=resource_in)
        
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="update",
            resource_type="resource",
            resource_id=str(resource_id),
            changes={"before": old_data, "after": {"name": updated_resource.name, "resource_type": updated_resource.resource_type}},
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            status="success"
        )
        
        return updated_resource
    except Exception as e:
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="update",
            resource_type="resource",
            resource_id=str(resource_id),
            status="failed",
            error_message=str(e),
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        raise


@router.delete("/{resource_id}")
async def delete_resource(
    resource_id: UUID,
    request: Request,
    current_user: Annotated[User, Depends(get_current_admin_user)],
    db: AsyncSession = Depends(get_session),
) -> Any:
    """删除资源"""
    # 首先检查资源是否存在
    resource = await crud_resource.get(db, resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    try:
        # 保存删除前数据
        deleted_data = {"name": resource.name, "resource_type": resource.resource_type}
        
        # 删除相关的资源记录
        from sqlalchemy import delete
        from app.models.tables import ResourceAchievement, ResourceUsageLog
        
        # 先删除资源成果记录
        delete_achievements_stmt = delete(ResourceAchievement).where(ResourceAchievement.resource_id == resource_id)
        await db.execute(delete_achievements_stmt)
        
        # 删除资源使用日志记录
        delete_usage_logs_stmt = delete(ResourceUsageLog).where(ResourceUsageLog.resource_id == resource_id)
        await db.execute(delete_usage_logs_stmt)
        
        # 然后删除资源
        resource = await crud_resource.remove(db, id=resource_id)
        
        # 记录日志
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="delete",
            resource_type="resource",
            resource_id=str(resource_id),
            changes={"before": deleted_data},
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            status="success"
        )
        
        return {"message": "Resource and related achievements deleted successfully"}
    except Exception as e:
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="delete",
            resource_type="resource",
            resource_id=str(resource_id),
            status="failed",
            error_message=str(e),
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        raise

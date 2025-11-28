from typing import Any, Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import crud_patent
from app.db.postgres import get_session
from app.api.deps import get_current_admin_user
from app.models.tables import User
from app.services.audit_log import audit_log_service
from app.schemas.common import PaginatedResponse, PaginationParams, StatsResponse
from app.schemas.patents import PatentCreate, PatentListItem, PatentResponse, PatentUpdate

router = APIRouter(prefix="/patents", tags=["Patents"])


@router.get("/", response_model=PaginatedResponse[PatentListItem])
async def get_patents(
    pagination: PaginationParams = Depends(),
    status: str = Query(None, description="Filter by status"),
    technology_field: str = Query(None, description="Filter by technology field"),
    search: str = Query(None, description="Search keyword"),
    db: AsyncSession = Depends(get_session),
) -> Any:
    """获取专利列表"""
    filters = {}
    if status:
        filters["status"] = status
    if technology_field:
        filters["technology_field"] = technology_field

    # 如果有搜索关键词，优先使用搜索逻辑
    if search:
        patents = await crud_patent.search(
            db,
            query=search,
            skip=pagination.offset,
            limit=pagination.size,
        )
        total = len(patents)
    else:
        patents = await crud_patent.get_multi(
            db, skip=pagination.offset, limit=pagination.size, filters=filters
        )
        total = await crud_patent.count(db, filters=filters)

    items = [
        PatentListItem(
            id=patent.id,
            name=patent.name,
            patent_number=patent.patent_number,
            patent_type=patent.patent_type,
            status=patent.status,
            technology_field=patent.technology_field,
            application_date=patent.application_date,
            maintenance_deadline=patent.maintenance_deadline,
        )
        for patent in patents
    ]

    return PaginatedResponse(
        items=items,
        total=total,
        page=pagination.page,
        size=pagination.size,
        pages=(total + pagination.size - 1) // pagination.size,
    )


@router.get("/stats", response_model=list[StatsResponse])
async def get_patent_stats(db: AsyncSession = Depends(get_session)) -> Any:
    """获取专利统计数据"""
    stats = await crud_patent.get_stats(db)
    
    return [
        StatsResponse(label="总专利数", value=stats["total"], change="+5", trend="up"),
        StatsResponse(label="已授权", value=stats["authorized"], change="+3", trend="up"),
        StatsResponse(label="申请中", value=stats["pending"], change="+2", trend="up"),
        StatsResponse(label="维护中", value=stats["maintenance"], change="0", trend="stable"),
    ]


@router.get("/maintenance-reminders", response_model=list[PatentResponse])
async def get_maintenance_reminders(
    days_ahead: int = Query(30, description="Days ahead to check for maintenance"),
    db: AsyncSession = Depends(get_session),
) -> Any:
    """获取维护提醒"""
    return await crud_patent.get_maintenance_reminders(db, days_ahead=days_ahead)


@router.get("/{patent_id}", response_model=PatentResponse)
async def get_patent(
    patent_id: UUID,
    db: AsyncSession = Depends(get_session),
) -> Any:
    """获取专利详情"""
    patent = await crud_patent.get(db, patent_id)
    if not patent:
        raise HTTPException(status_code=404, detail="Patent not found")
    return patent


@router.post("/", response_model=PatentResponse)
async def create_patent(
    patent_in: PatentCreate,
    request: Request,
    current_user: Annotated[User, Depends(get_current_admin_user)],
    db: AsyncSession = Depends(get_session),
) -> Any:
    """创建专利（需要管理员权限）"""
    try:
        patent = await crud_patent.create(db, obj_in=patent_in)
        
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="create",
            resource_type="patent",
            resource_id=str(patent.id),
            changes={"after": {"name": patent.name, "status": patent.status}},
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            status="success"
        )
        return patent
    except Exception as e:
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="create",
            resource_type="patent",
            status="failed",
            error_message=str(e),
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        raise


@router.put("/{patent_id}", response_model=PatentResponse)
async def update_patent(
    patent_id: UUID,
    patent_in: PatentUpdate,
    request: Request,
    current_user: Annotated[User, Depends(get_current_admin_user)],
    db: AsyncSession = Depends(get_session),
) -> Any:
    """更新专利（需要管理员权限）"""
    patent = await crud_patent.get(db, patent_id)
    if not patent:
        raise HTTPException(status_code=404, detail="Patent not found")
    
    try:
        old_data = {"name": patent.name, "status": patent.status}
        updated_patent = await crud_patent.update(db, db_obj=patent, obj_in=patent_in)
        
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="update",
            resource_type="patent",
            resource_id=str(patent_id),
            changes={"before": old_data, "after": {"name": updated_patent.name, "status": updated_patent.status}},
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            status="success"
        )
        return updated_patent
    except Exception as e:
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="update",
            resource_type="patent",
            resource_id=str(patent_id),
            status="failed",
            error_message=str(e),
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        raise


@router.delete("/{patent_id}")
async def delete_patent(
    patent_id: UUID,
    request: Request,
    current_user: Annotated[User, Depends(get_current_admin_user)],
    db: AsyncSession = Depends(get_session),
) -> Any:
    """删除专利（需要管理员权限）"""
    patent_to_delete = await crud_patent.get(db, patent_id)
    if not patent_to_delete:
        raise HTTPException(status_code=404, detail="Patent not found")
    
    try:
        deleted_data = {"name": patent_to_delete.name, "status": patent_to_delete.status}
        patent = await crud_patent.remove(db, id=patent_id)
        
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="delete",
            resource_type="patent",
            resource_id=str(patent_id),
            changes={"before": deleted_data},
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            status="success"
        )
        return {"message": "Patent deleted successfully"}
    except Exception as e:
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="delete",
            resource_type="patent",
            resource_id=str(patent_id),
            status="failed",
            error_message=str(e),
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        raise

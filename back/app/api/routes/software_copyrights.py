from typing import Any, Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.software_copyrights import crud_software_copyright
from app.db.postgres import get_session
from app.api.deps import get_current_admin_user
from app.models.tables import User
from app.services.audit_log import audit_log_service
from app.schemas.common import PaginatedResponse, PaginationParams, StatsResponse
from app.schemas.software_copyrights import (
    SoftwareCopyrightCreate,
    SoftwareCopyrightListItem,
    SoftwareCopyrightResponse,
    SoftwareCopyrightUpdate,
)

router = APIRouter(prefix="/software-copyrights", tags=["Software Copyrights"])


def map_software_copyright_to_response(sc) -> dict:
    """将数据库模型映射到API响应格式"""
    developer_name = None
    if sc.developers:
        developers_list = sc.developers.get("developers", [])
        if developers_list:
            developer_name = developers_list[0] if isinstance(developers_list, list) else developers_list
    
    return {
        "id": sc.id,
        "name": sc.name,
        "version": sc.version,
        "registration_number": sc.registration_number,
        "status": sc.status,
        "application_date": sc.registration_date,
        "approval_date": sc.latest_update,
        "developer": developer_name,
        "category": sc.category,
        "language": sc.development_language,
        "description": None,  # 数据库中没有此字段
        "created_at": sc.created_at,
        "updated_at": sc.updated_at,
    }


@router.get("/", response_model=PaginatedResponse[SoftwareCopyrightListItem])
async def get_software_copyrights(
    pagination: PaginationParams = Depends(),
    status: str = Query(None, description="Filter by status"),
    search: str = Query(None, description="Search keyword"),
    db: AsyncSession = Depends(get_session),
) -> Any:
    """获取软著列表"""
    filters = {}
    if status:
        # 状态映射
        status_map = {
            "已登记": "registered",
            "申请中": "pending",
            "待更新": "update_needed"
        }
        filters["status"] = status_map.get(status, status)

    if search:
        software_copyrights = await crud_software_copyright.search(
            db, query=search, skip=pagination.offset, limit=pagination.size
        )
        total = len(software_copyrights)
    else:
        software_copyrights = await crud_software_copyright.get_multi(
            db, skip=pagination.offset, limit=pagination.size, filters=filters
        )
        total = await crud_software_copyright.count(db, filters=filters)

    items = [SoftwareCopyrightListItem(**map_software_copyright_to_response(sc)) for sc in software_copyrights]

    return PaginatedResponse(
        items=items,
        total=total,
        page=pagination.page,
        size=pagination.size,
        pages=(total + pagination.size - 1) // pagination.size,
    )


@router.get("/stats", response_model=list[StatsResponse])
async def get_software_copyright_stats(db: AsyncSession = Depends(get_session)) -> Any:
    """获取软著统计数据"""
    stats = await crud_software_copyright.get_stats(db)
    
    return [
        StatsResponse(label="总软著数", value=stats["total"], change="+3", trend="up"),
        StatsResponse(label="已登记", value=stats["registered"], change="+2", trend="up"),
        StatsResponse(label="申请中", value=stats["pending"], change="+1", trend="up"),
        StatsResponse(label="待更新", value=stats["update_needed"], change="0", trend="stable"),
    ]


@router.get("/{software_copyright_id}", response_model=SoftwareCopyrightResponse)
async def get_software_copyright(
    software_copyright_id: UUID,
    db: AsyncSession = Depends(get_session),
) -> Any:
    """获取软著详情"""
    software_copyright = await crud_software_copyright.get(db, software_copyright_id)
    if not software_copyright:
        raise HTTPException(status_code=404, detail="Software copyright not found")
    return SoftwareCopyrightResponse(**map_software_copyright_to_response(software_copyright))


@router.post("/", response_model=SoftwareCopyrightResponse)
async def create_software_copyright(
    software_copyright_in: SoftwareCopyrightCreate,
    request: Request,
    current_user: Annotated[User, Depends(get_current_admin_user)],
    db: AsyncSession = Depends(get_session),
) -> Any:
    """创建软著"""
    # 创建数据库映射的数据对象
    from app.models.tables import SoftwareCopyright
    
    # 构建数据库字段数据
    db_data = {
        "name": software_copyright_in.name,
        "version": software_copyright_in.version,
        "registration_number": software_copyright_in.registration_number,
        "status": software_copyright_in.status,
        "registration_date": software_copyright_in.application_date,
        "latest_update": software_copyright_in.approval_date,
        "developers": {"developers": [software_copyright_in.developer]} if software_copyright_in.developer else None,
        "category": software_copyright_in.category,
        "development_language": software_copyright_in.language,
    }
    
    # 直接创建数据库对象
    try:
        db_obj = SoftwareCopyright(**{k: v for k, v in db_data.items() if v is not None})
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        
        # 记录日志
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="create",
            resource_type="software_copyright",
            resource_id=str(db_obj.id),
            changes={"after": {"name": db_obj.name, "category": db_obj.category}},
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            status="success"
        )
        
        return SoftwareCopyrightResponse(**map_software_copyright_to_response(db_obj))
    except Exception as e:
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="create",
            resource_type="software_copyright",
            status="failed",
            error_message=str(e),
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        raise


@router.put("/{software_copyright_id}", response_model=SoftwareCopyrightResponse)
async def update_software_copyright(
    software_copyright_id: UUID,
    software_copyright_in: SoftwareCopyrightUpdate,
    request: Request,
    current_user: Annotated[User, Depends(get_current_admin_user)],
    db: AsyncSession = Depends(get_session),
) -> Any:
    """更新软著"""
    software_copyright = await crud_software_copyright.get(db, software_copyright_id)
    if not software_copyright:
        raise HTTPException(status_code=404, detail="Software copyright not found")
    
    # 将API字段映射到数据库字段
    update_data = {}
    if software_copyright_in.name is not None:
        update_data["name"] = software_copyright_in.name
    if software_copyright_in.version is not None:
        update_data["version"] = software_copyright_in.version
    if software_copyright_in.registration_number is not None:
        update_data["registration_number"] = software_copyright_in.registration_number
    if software_copyright_in.status is not None:
        update_data["status"] = software_copyright_in.status
    if software_copyright_in.application_date is not None:
        update_data["registration_date"] = software_copyright_in.application_date
    if software_copyright_in.approval_date is not None:
        update_data["latest_update"] = software_copyright_in.approval_date
    if software_copyright_in.developer is not None:
        update_data["developers"] = {"developers": [software_copyright_in.developer]}
    if software_copyright_in.category is not None:
        update_data["category"] = software_copyright_in.category
    if software_copyright_in.language is not None:
        update_data["development_language"] = software_copyright_in.language
    
    try:
        old_data = {"name": software_copyright.name, "category": software_copyright.category}
        updated = await crud_software_copyright.update(db, db_obj=software_copyright, obj_in=update_data)
        
        # 记录日志
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="update",
            resource_type="software_copyright",
            resource_id=str(software_copyright_id),
            changes={"before": old_data, "after": {"name": updated.name, "category": updated.category}},
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            status="success"
        )
        
        return SoftwareCopyrightResponse(**map_software_copyright_to_response(updated))
    except Exception as e:
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="update",
            resource_type="software_copyright",
            resource_id=str(software_copyright_id),
            status="failed",
            error_message=str(e),
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        raise


@router.delete("/{software_copyright_id}")
async def delete_software_copyright(
    software_copyright_id: UUID,
    request: Request,
    current_user: Annotated[User, Depends(get_current_admin_user)],
    db: AsyncSession = Depends(get_session),
) -> Any:
    """删除软著"""
    software_copyright_to_delete = await crud_software_copyright.get(db, software_copyright_id)
    if not software_copyright_to_delete:
        raise HTTPException(status_code=404, detail="Software copyright not found")
    
    try:
        deleted_data = {"name": software_copyright_to_delete.name, "category": software_copyright_to_delete.category}
        software_copyright = await crud_software_copyright.remove(db, id=software_copyright_id)
        
        # 记录日志
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="delete",
            resource_type="software_copyright",
            resource_id=str(software_copyright_id),
            changes={"before": deleted_data},
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            status="success"
        )
        
        return {"message": "Software copyright deleted successfully"}
    except Exception as e:
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="delete",
            resource_type="software_copyright",
            resource_id=str(software_copyright_id),
            status="failed",
            error_message=str(e),
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        raise

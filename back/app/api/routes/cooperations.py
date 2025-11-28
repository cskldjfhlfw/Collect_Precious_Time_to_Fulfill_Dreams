from typing import Any, Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.cooperations import crud_cooperation
from app.db.postgres import get_session
from app.api.deps import get_current_admin_user
from app.models.tables import User
from app.services.audit_log import audit_log_service
from app.schemas.common import PaginatedResponse, PaginationParams, StatsResponse
from app.schemas.cooperations import (
    CooperationCreate,
    CooperationListItem,
    CooperationResponse,
    CooperationUpdate,
)

router = APIRouter(prefix="/cooperations", tags=["Cooperations"])


def map_cooperation_to_response(coop) -> dict:
    """将数据库模型映射到API响应格式"""
    return {
        "id": coop.id,
        "name": coop.organization,
        "type": coop.cooperation_type,
        "location": None,  # 数据库中没有此字段
        "status": coop.status,
        "projects": 0,  # 需要关联查询项目数量
        "contact_person": coop.contact_person,
        "email": coop.contact_email,
        "phone": coop.contact_phone,
        "established_date": coop.start_date,
        "last_contact": coop.next_follow_up,
        "value": coop.pipeline_stage,
        "field": None,  # 数据库中没有此字段
        "description": coop.content,
        "created_at": coop.created_at,
        "updated_at": coop.updated_at,
    }


@router.get("/", response_model=PaginatedResponse[CooperationListItem])
async def get_cooperations(
    pagination: PaginationParams = Depends(),
    status: str = Query(None, description="Filter by status"),
    search: str = Query(None, description="Search keyword"),
    db: AsyncSession = Depends(get_session),
) -> Any:
    """获取合作列表"""
    filters = {}
    if status:
        # 状态映射
        status_map = {
            "活跃合作": "active",
            "洽谈中": "negotiating",
            "暂停": "paused",
            "终止": "terminated"
        }
        filters["status"] = status_map.get(status, status)

    if search:
        cooperations = await crud_cooperation.search(
            db, query=search, skip=pagination.offset, limit=pagination.size
        )
        total = len(cooperations)
    else:
        cooperations = await crud_cooperation.get_multi(
            db, skip=pagination.offset, limit=pagination.size, filters=filters
        )
        total = await crud_cooperation.count(db, filters=filters)

    items = [CooperationListItem(**map_cooperation_to_response(coop)) for coop in cooperations]

    return PaginatedResponse(
        items=items,
        total=total,
        page=pagination.page,
        size=pagination.size,
        pages=(total + pagination.size - 1) // pagination.size,
    )


@router.get("/stats", response_model=list[StatsResponse])
async def get_cooperation_stats(db: AsyncSession = Depends(get_session)) -> Any:
    """获取合作统计数据"""
    stats = await crud_cooperation.get_stats(db)
    
    # 计算变化趋势（这里可以根据实际需求计算月度变化）
    # 暂时使用实际数值作为基础
    total = stats["total"]
    ongoing = stats["ongoing"] 
    completed = stats["completed"]
    planning = stats["planning"]
    
    return [
        StatsResponse(
            label="总合作数", 
            value=total, 
            change=f"+{max(0, total - 8)}" if total > 8 else "0", 
            trend="up" if total > 8 else "stable"
        ),
        StatsResponse(
            label="进行中", 
            value=ongoing, 
            change=f"+{max(0, ongoing - 3)}" if ongoing > 3 else "0", 
            trend="up" if ongoing > 3 else "stable"
        ),
        StatsResponse(
            label="已完成", 
            value=completed, 
            change=f"+{max(0, completed - 2)}" if completed > 2 else "0", 
            trend="up" if completed > 2 else "stable"
        ),
        StatsResponse(
            label="计划中", 
            value=planning, 
            change=f"+{max(0, planning - 1)}" if planning > 1 else "0", 
            trend="up" if planning > 1 else "stable"
        ),
    ]


@router.get("/{cooperation_id}", response_model=CooperationResponse)
async def get_cooperation(
    cooperation_id: UUID,
    db: AsyncSession = Depends(get_session),
) -> Any:
    """获取合作详情"""
    cooperation = await crud_cooperation.get(db, cooperation_id)
    if not cooperation:
        raise HTTPException(status_code=404, detail="Cooperation not found")
    return CooperationResponse(**map_cooperation_to_response(cooperation))


@router.post("/", response_model=CooperationResponse)
async def create_cooperation(
    cooperation_in: CooperationCreate,
    request: Request,
    current_user: Annotated[User, Depends(get_current_admin_user)],
    db: AsyncSession = Depends(get_session),
) -> Any:
    """创建合作"""
    # 直接创建数据库对象
    from app.models.tables import Cooperation
    
    # 构建数据库字段数据
    db_data = {
        "organization": cooperation_in.name,
        "cooperation_type": cooperation_in.type,
        "status": cooperation_in.status,
        "contact_person": cooperation_in.contact_person,
        "contact_email": cooperation_in.email,
        "contact_phone": cooperation_in.phone,
        "start_date": cooperation_in.established_date,
        "next_follow_up": cooperation_in.last_contact,
        "pipeline_stage": cooperation_in.value,
        "content": cooperation_in.description,
    }
    
    # 直接创建数据库对象
    try:
        db_obj = Cooperation(**{k: v for k, v in db_data.items() if v is not None})
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="create",
            resource_type="cooperation",
            resource_id=str(db_obj.id),
            changes={"after": {"organization": db_obj.organization, "cooperation_type": db_obj.cooperation_type}},
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            status="success"
        )
        
        return CooperationResponse(**map_cooperation_to_response(db_obj))
    except Exception as e:
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="create",
            resource_type="cooperation",
            status="failed",
            error_message=str(e),
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        raise


@router.put("/{cooperation_id}", response_model=CooperationResponse)
async def update_cooperation(
    cooperation_id: UUID,
    cooperation_in: CooperationUpdate,
    request: Request,
    current_user: Annotated[User, Depends(get_current_admin_user)],
    db: AsyncSession = Depends(get_session),
) -> Any:
    """更新合作"""
    cooperation = await crud_cooperation.get(db, cooperation_id)
    if not cooperation:
        raise HTTPException(status_code=404, detail="Cooperation not found")
    
    # 将API字段映射到数据库字段
    update_data = {}
    if cooperation_in.name is not None:
        update_data["organization"] = cooperation_in.name
    if cooperation_in.type is not None:
        update_data["cooperation_type"] = cooperation_in.type
    if cooperation_in.status is not None:
        update_data["status"] = cooperation_in.status
    if cooperation_in.contact_person is not None:
        update_data["contact_person"] = cooperation_in.contact_person
    if cooperation_in.email is not None:
        update_data["contact_email"] = cooperation_in.email
    if cooperation_in.phone is not None:
        update_data["contact_phone"] = cooperation_in.phone
    if cooperation_in.established_date is not None:
        update_data["start_date"] = cooperation_in.established_date
    if cooperation_in.last_contact is not None:
        update_data["next_follow_up"] = cooperation_in.last_contact
    if cooperation_in.value is not None:
        update_data["pipeline_stage"] = cooperation_in.value
    if cooperation_in.description is not None:
        update_data["content"] = cooperation_in.description
    
    try:
        old_data = {"organization": cooperation.organization, "cooperation_type": cooperation.cooperation_type}
        updated = await crud_cooperation.update(db, db_obj=cooperation, obj_in=update_data)
        
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="update",
            resource_type="cooperation",
            resource_id=str(cooperation_id),
            changes={"before": old_data, "after": {"organization": updated.organization, "cooperation_type": updated.cooperation_type}},
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            status="success"
        )
        
        return CooperationResponse(**map_cooperation_to_response(updated))
    except Exception as e:
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="update",
            resource_type="cooperation",
            resource_id=str(cooperation_id),
            status="failed",
            error_message=str(e),
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        raise


@router.delete("/{cooperation_id}")
async def delete_cooperation(
    cooperation_id: UUID,
    request: Request,
    current_user: Annotated[User, Depends(get_current_admin_user)],
    db: AsyncSession = Depends(get_session),
) -> Any:
    """删除合作"""
    cooperation_to_delete = await crud_cooperation.get(db, cooperation_id)
    if not cooperation_to_delete:
        raise HTTPException(status_code=404, detail="Cooperation not found")
    
    try:
        deleted_data = {"organization": cooperation_to_delete.organization, "cooperation_type": cooperation_to_delete.cooperation_type}
        cooperation = await crud_cooperation.remove(db, id=cooperation_id)
        
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="delete",
            resource_type="cooperation",
            resource_id=str(cooperation_id),
            changes={"before": deleted_data},
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            status="success"
        )
        
        return {"message": "Cooperation deleted successfully"}
    except Exception as e:
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="delete",
            resource_type="cooperation",
            resource_id=str(cooperation_id),
            status="failed",
            error_message=str(e),
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        raise

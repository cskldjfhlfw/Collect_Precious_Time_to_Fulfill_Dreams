from typing import Any, Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.conferences import crud_conference
from app.db.postgres import get_session
from app.api.deps import get_current_admin_user
from app.models.tables import User
from app.services.audit_log import audit_log_service
from app.schemas.common import PaginatedResponse, PaginationParams, StatsResponse
from app.schemas.conferences import (
    ConferenceCreate,
    ConferenceListItem,
    ConferenceResponse,
    ConferenceUpdate,
)

router = APIRouter(prefix="/conferences", tags=["Conferences"])


def map_conference_to_response(conf) -> dict:
    """将数据库模型映射到API响应格式"""
    participants_list = []
    if conf.participants:
        participants_list = conf.participants.get("participants", [])
    
    return {
        "id": conf.id,
        "name": conf.name,
        "location": conf.location,
        "start_date": conf.start_date,
        "end_date": conf.end_date,
        "status": conf.participation_type or "待申请",
        "submission_status": conf.submission_status,
        "participants": participants_list,
        "budget": conf.travel_budget,
        "used": conf.travel_expense,
        "category": conf.level,
        "paper_title": None,  # 数据库中没有此字段
        "description": conf.description,
        "created_at": conf.created_at,
        "updated_at": conf.updated_at,
    }


@router.get("/", response_model=PaginatedResponse[ConferenceListItem])
async def get_conferences(
    pagination: PaginationParams = Depends(),
    status: str = Query(None, description="Filter by status"),
    search: str = Query(None, description="Search keyword"),
    db: AsyncSession = Depends(get_session),
) -> Any:
    """获取会议列表"""
    filters = {}
    if status:
        # 状态映射
        status_map = {
            "即将参加": "planned",
            "已参加": "attended",
            "待申请": "pending"
        }
        filters["participation_type"] = status_map.get(status, status)

    if search:
        conferences = await crud_conference.search(
            db, query=search, skip=pagination.offset, limit=pagination.size
        )
        total = len(conferences)
    else:
        conferences = await crud_conference.get_multi(
            db, skip=pagination.offset, limit=pagination.size, filters=filters
        )
        total = await crud_conference.count(db, filters=filters)

    items = [ConferenceListItem(**map_conference_to_response(conf)) for conf in conferences]

    return PaginatedResponse(
        items=items,
        total=total,
        page=pagination.page,
        size=pagination.size,
        pages=(total + pagination.size - 1) // pagination.size,
    )


@router.get("/stats", response_model=list[StatsResponse])
async def get_conference_stats(db: AsyncSession = Depends(get_session)) -> Any:
    """获取会议统计数据"""
    stats = await crud_conference.get_stats(db)
    
    # 计算变化趋势（这里可以根据实际需求计算月度变化）
    # 暂时使用实际数值作为基础
    total = stats["total"]
    attended = stats["attended"] 
    planned = stats["planned"]
    completed = stats["completed"]
    
    return [
        StatsResponse(
            label="总会议数", 
            value=total, 
            change=f"+{max(0, total - 10)}" if total > 10 else "0", 
            trend="up" if total > 10 else "stable"
        ),
        StatsResponse(
            label="已参加", 
            value=attended, 
            change=f"+{max(0, attended - 5)}" if attended > 5 else "0", 
            trend="up" if attended > 5 else "stable"
        ),
        StatsResponse(
            label="计划中", 
            value=planned, 
            change=f"+{max(0, planned - 3)}" if planned > 3 else "0", 
            trend="up" if planned > 3 else "stable"
        ),
        StatsResponse(
            label="已结束", 
            value=completed, 
            change=f"+{max(0, completed - 2)}" if completed > 2 else "0", 
            trend="up" if completed > 2 else "stable"
        ),
    ]


@router.get("/{conference_id}", response_model=ConferenceResponse)
async def get_conference(
    conference_id: UUID,
    db: AsyncSession = Depends(get_session),
) -> Any:
    """获取会议详情"""
    conference = await crud_conference.get(db, conference_id)
    if not conference:
        raise HTTPException(status_code=404, detail="Conference not found")
    return ConferenceResponse(**map_conference_to_response(conference))


@router.post("/", response_model=ConferenceResponse)
async def create_conference(
    conference_in: ConferenceCreate,
    request: Request,
    current_user: Annotated[User, Depends(get_current_admin_user)],
    db: AsyncSession = Depends(get_session),
) -> Any:
    """创建会议"""
    # 直接创建数据库对象
    from app.models.tables import Conference
    
    # 构建数据库字段数据
    db_data = {
        "name": conference_in.name,
        "location": conference_in.location,
        "start_date": conference_in.start_date,
        "end_date": conference_in.end_date,
        "participation_type": conference_in.status,
        "submission_status": conference_in.submission_status,
        "participants": {"participants": conference_in.participants} if conference_in.participants else None,
        "travel_budget": conference_in.budget,
        "travel_expense": conference_in.used,
        "level": conference_in.category,
        "description": conference_in.description,
    }
    
    # 直接创建数据库对象
    try:
        db_obj = Conference(**{k: v for k, v in db_data.items() if v is not None})
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="create",
            resource_type="conference",
            resource_id=str(db_obj.id),
            changes={"after": {"name": db_obj.name, "participation_type": db_obj.participation_type}},
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            status="success"
        )
        
        return ConferenceResponse(**map_conference_to_response(db_obj))
    except Exception as e:
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="create",
            resource_type="conference",
            status="failed",
            error_message=str(e),
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        raise


@router.put("/{conference_id}", response_model=ConferenceResponse)
async def update_conference(
    conference_id: UUID,
    conference_in: ConferenceUpdate,
    request: Request,
    current_user: Annotated[User, Depends(get_current_admin_user)],
    db: AsyncSession = Depends(get_session),
) -> Any:
    """更新会议"""
    conference = await crud_conference.get(db, conference_id)
    if not conference:
        raise HTTPException(status_code=404, detail="Conference not found")
    
    # 将API字段映射到数据库字段
    update_data = {}
    if conference_in.name is not None:
        update_data["name"] = conference_in.name
    if conference_in.location is not None:
        update_data["location"] = conference_in.location
    if conference_in.start_date is not None:
        update_data["start_date"] = conference_in.start_date
    if conference_in.end_date is not None:
        update_data["end_date"] = conference_in.end_date
    if conference_in.status is not None:
        update_data["participation_type"] = conference_in.status
    if conference_in.submission_status is not None:
        update_data["submission_status"] = conference_in.submission_status
    if conference_in.participants is not None:
        update_data["participants"] = {"participants": conference_in.participants}
    if conference_in.budget is not None:
        update_data["travel_budget"] = conference_in.budget
    if conference_in.used is not None:
        update_data["travel_expense"] = conference_in.used
    if conference_in.category is not None:
        update_data["level"] = conference_in.category
    if conference_in.description is not None:
        update_data["description"] = conference_in.description
    
    try:
        old_data = {"name": conference.name, "participation_type": conference.participation_type}
        updated = await crud_conference.update(db, db_obj=conference, obj_in=update_data)
        
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="update",
            resource_type="conference",
            resource_id=str(conference_id),
            changes={"before": old_data, "after": {"name": updated.name, "participation_type": updated.participation_type}},
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            status="success"
        )
        
        return ConferenceResponse(**map_conference_to_response(updated))
    except Exception as e:
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="update",
            resource_type="conference",
            resource_id=str(conference_id),
            status="failed",
            error_message=str(e),
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        raise


@router.delete("/{conference_id}")
async def delete_conference(
    conference_id: UUID,
    request: Request,
    current_user: Annotated[User, Depends(get_current_admin_user)],
    db: AsyncSession = Depends(get_session),
) -> Any:
    """删除会议"""
    conference_to_delete = await crud_conference.get(db, conference_id)
    if not conference_to_delete:
        raise HTTPException(status_code=404, detail="Conference not found")
    
    try:
        deleted_data = {"name": conference_to_delete.name, "participation_type": conference_to_delete.participation_type}
        conference = await crud_conference.remove(db, id=conference_id)
        
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="delete",
            resource_type="conference",
            resource_id=str(conference_id),
            changes={"before": deleted_data},
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            status="success"
        )
        
        return {"message": "Conference deleted successfully"}
    except Exception as e:
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="delete",
            resource_type="conference",
            resource_id=str(conference_id),
            status="failed",
            error_message=str(e),
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        raise

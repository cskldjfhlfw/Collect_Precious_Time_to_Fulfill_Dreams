from typing import Any, Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.competitions import crud_competition
from app.db.postgres import get_session
from app.api.deps import get_current_admin_user
from app.models.tables import User
from app.services.audit_log import audit_log_service
from app.schemas.common import PaginatedResponse, PaginationParams, StatsResponse
from app.schemas.competitions import (
    CompetitionCreate,
    CompetitionListItem,
    CompetitionResponse,
    CompetitionUpdate,
)

router = APIRouter(prefix="/competitions", tags=["Competitions"])


def map_competition_to_response(comp) -> dict:
    """将数据库模型映射到API响应格式"""
    # 处理 members 字段，将字典转换为字符串列表
    members = []
    if comp.team_members and comp.team_members.get("members"):
        for member in comp.team_members["members"]:
            if isinstance(member, dict):
                # 如果是字典，提取姓名
                name = member.get("name", "")
                affiliation = member.get("affiliation", "")
                if affiliation:
                    members.append(f"{name}({affiliation})")
                else:
                    members.append(name)
            elif isinstance(member, str):
                # 如果已经是字符串，直接添加
                members.append(member)
    
    # 创建响应数据字典，注意不包含原始的team_members字段
    return {
        "id": comp.id,
        "name": comp.name,
        "category": "创新创业",  # 可以从其他字段派生或设置默认值
        "status": comp.status,
        "level": comp.level,
        "team": comp.mentor,  # 使用mentor字段作为team
        "members": members,
        "registration_date": comp.registration_deadline,
        "submission_deadline": comp.submission_deadline,
        "final_date": comp.award_date,
        "award": comp.award_level,
        "progress": comp.progress_percent,
        "description": None,  # 数据库中没有此字段
        "created_at": comp.created_at,
        "updated_at": comp.updated_at,
        # 不要包含 team_members 字段，避免前端渲染对象导致错误
    }


@router.get("/", response_model=PaginatedResponse[CompetitionListItem])
async def get_competitions(
    pagination: PaginationParams = Depends(),
    status: str = Query(None, description="Filter by status"),
    search: str = Query(None, description="Search keyword"),
    db: AsyncSession = Depends(get_session),
) -> Any:
    """获取比赛列表"""
    filters = {}
    if status:
        # 状态映射
        status_map = {
            "进行中": "ongoing",
            "已结束": "completed",
            "待报名": "planning"
        }
        filters["status"] = status_map.get(status, status)

    if search:
        competitions = await crud_competition.search(
            db, query=search, skip=pagination.offset, limit=pagination.size
        )
        total = len(competitions)
    else:
        competitions = await crud_competition.get_multi(
            db, skip=pagination.offset, limit=pagination.size, filters=filters
        )
        total = await crud_competition.count(db, filters=filters)

    items = [CompetitionListItem(**map_competition_to_response(comp)) for comp in competitions]

    return PaginatedResponse(
        items=items,
        total=total,
        page=pagination.page,
        size=pagination.size,
        pages=(total + pagination.size - 1) // pagination.size,
    )


@router.get("/stats", response_model=list[StatsResponse])
async def get_competition_stats(db: AsyncSession = Depends(get_session)) -> Any:
    """获取比赛统计数据"""
    stats = await crud_competition.get_stats(db)
    
    return [
        StatsResponse(label="总参赛数", value=stats["total"], change="+6", trend="up"),
        StatsResponse(label="获奖数量", value=stats["awarded"], change="+4", trend="up"),
        StatsResponse(label="进行中", value=stats["ongoing"], change="+2", trend="up"),
        StatsResponse(label="待报名", value=stats["planning"], change="+1", trend="up"),
    ]


@router.get("/{competition_id}", response_model=CompetitionResponse)
async def get_competition(
    competition_id: UUID,
    db: AsyncSession = Depends(get_session),
) -> Any:
    """获取比赛详情"""
    competition = await crud_competition.get(db, competition_id)
    if not competition:
        raise HTTPException(status_code=404, detail="Competition not found")
    return CompetitionResponse(**map_competition_to_response(competition))


@router.post("/", response_model=CompetitionResponse)
async def create_competition(
    competition_in: CompetitionCreate,
    request: Request,
    current_user: Annotated[User, Depends(get_current_admin_user)],
    db: AsyncSession = Depends(get_session),
) -> Any:
    """创建竞赛（需要管理员权限）"""
    try:
        competition = await crud_competition.create(db, obj_in=competition_in)
        
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="create",
            resource_type="competition",
            resource_id=str(competition.id),
            changes={"after": {"name": competition.name, "level": competition.level}},
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            status="success"
        )
        
        return CompetitionResponse(**map_competition_to_response(competition))
    except Exception as e:
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="create",
            resource_type="competition",
            status="failed",
            error_message=str(e),
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        raise


@router.put("/{competition_id}", response_model=CompetitionResponse)
async def update_competition(
    competition_id: UUID,
    competition_in: CompetitionUpdate,
    request: Request,
    current_user: Annotated[User, Depends(get_current_admin_user)],
    db: AsyncSession = Depends(get_session),
) -> Any:
    """更新比赛"""
    competition = await crud_competition.get(db, competition_id)
    if not competition:
        raise HTTPException(status_code=404, detail="Competition not found")
    
    # 将API字段映射到数据库字段
    update_data = {}
    if competition_in.name is not None:
        update_data["name"] = competition_in.name
    if competition_in.level is not None:
        update_data["level"] = competition_in.level
    if competition_in.registration_deadline is not None:
        update_data["registration_deadline"] = competition_in.registration_deadline
    if competition_in.submission_deadline is not None:
        update_data["submission_deadline"] = competition_in.submission_deadline
    if competition_in.award_date is not None:
        update_data["award_date"] = competition_in.award_date
    if competition_in.award_level is not None:
        update_data["award_level"] = competition_in.award_level
    if competition_in.progress_percent is not None:
        update_data["progress_percent"] = competition_in.progress_percent
    if competition_in.mentor is not None:
        update_data["mentor"] = competition_in.mentor
    if competition_in.team_members is not None:
        update_data["team_members"] = competition_in.team_members
    if competition_in.status is not None:
        update_data["status"] = competition_in.status
    
    try:
        old_data = {"name": competition.name, "level": competition.level}
        updated = await crud_competition.update(db, db_obj=competition, obj_in=update_data)
        
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="update",
            resource_type="competition",
            resource_id=str(competition_id),
            changes={"before": old_data, "after": {"name": updated.name, "level": updated.level}},
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            status="success"
        )
        
        return CompetitionResponse(**map_competition_to_response(updated))
    except Exception as e:
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="update",
            resource_type="competition",
            resource_id=str(competition_id),
            status="failed",
            error_message=str(e),
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        raise


@router.delete("/{competition_id}")
async def delete_competition(
    competition_id: UUID,
    request: Request,
    current_user: Annotated[User, Depends(get_current_admin_user)],
    db: AsyncSession = Depends(get_session),
) -> Any:
    """删除比赛"""
    competition_to_delete = await crud_competition.get(db, competition_id)
    if not competition_to_delete:
        raise HTTPException(status_code=404, detail="Competition not found")
    
    try:
        deleted_data = {"name": competition_to_delete.name, "level": competition_to_delete.level}
        competition = await crud_competition.remove(db, id=competition_id)
        
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="delete",
            resource_type="competition",
            resource_id=str(competition_id),
            changes={"before": deleted_data},
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            status="success"
        )
        
        return {"message": "Competition deleted successfully"}
    except Exception as e:
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="delete",
            resource_type="competition",
            resource_id=str(competition_id),
            status="failed",
            error_message=str(e),
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        raise

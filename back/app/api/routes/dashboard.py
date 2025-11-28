from typing import Any
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, extract, select

from app.crud import (
    crud_paper, crud_patent, crud_project, crud_resource,
    crud_software_copyright, crud_competition, crud_conference, crud_cooperation
)
from app.db.postgres import get_session
from app.schemas.common import StatsResponse
from app.models.tables import (
    Paper, Patent, Project, Resource, SoftwareCopyright, 
    Competition, Conference, Cooperation
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


async def get_monthly_trends(db: AsyncSession) -> list:
    """获取最近6个月的各模块统计趋势"""
    trends = []
    
    # 获取最近6个月
    current_date = datetime.now()
    
    for i in range(6):
        # 计算目标月份
        target_date = current_date - relativedelta(months=i)
        year = target_date.year
        month = target_date.month
        month_str = f"{year}-{month:02d}"
        
        # 查询各模块在该月的创建数量
        month_data = {
            "month": month_str,
            "papers": 0,
            "patents": 0,
            "projects": 0,
            "software": 0,
            "competitions": 0,
            "conferences": 0,
            "cooperations": 0,
        }
        
        # 论文统计
        papers_count = await db.execute(
            select(func.count(Paper.id)).where(
                extract('year', Paper.created_at) == year,
                extract('month', Paper.created_at) == month
            )
        )
        month_data["papers"] = papers_count.scalar() or 0
        
        # 专利统计
        patents_count = await db.execute(
            select(func.count(Patent.id)).where(
                extract('year', Patent.created_at) == year,
                extract('month', Patent.created_at) == month
            )
        )
        month_data["patents"] = patents_count.scalar() or 0
        
        # 项目统计
        projects_count = await db.execute(
            select(func.count(Project.id)).where(
                extract('year', Project.created_at) == year,
                extract('month', Project.created_at) == month
            )
        )
        month_data["projects"] = projects_count.scalar() or 0
        
        # 软著统计
        software_count = await db.execute(
            select(func.count(SoftwareCopyright.id)).where(
                extract('year', SoftwareCopyright.created_at) == year,
                extract('month', SoftwareCopyright.created_at) == month
            )
        )
        month_data["software"] = software_count.scalar() or 0
        
        # 竞赛统计
        competitions_count = await db.execute(
            select(func.count(Competition.id)).where(
                extract('year', Competition.created_at) == year,
                extract('month', Competition.created_at) == month
            )
        )
        month_data["competitions"] = competitions_count.scalar() or 0
        
        # 会议统计
        conferences_count = await db.execute(
            select(func.count(Conference.id)).where(
                extract('year', Conference.created_at) == year,
                extract('month', Conference.created_at) == month
            )
        )
        month_data["conferences"] = conferences_count.scalar() or 0
        
        # 合作统计
        cooperations_count = await db.execute(
            select(func.count(Cooperation.id)).where(
                extract('year', Cooperation.created_at) == year,
                extract('month', Cooperation.created_at) == month
            )
        )
        month_data["cooperations"] = cooperations_count.scalar() or 0
        
        trends.append(month_data)
    
    # 按时间正序排列（最早的月份在前面）
    trends.reverse()
    return trends


async def get_achievement_stats(db: AsyncSession) -> dict:
    """获取各模块的真实完成情况统计"""
    
    # 论文统计 - 按状态分组
    papers_published = await db.execute(
        select(func.count(Paper.id)).where(Paper.status == "published")
    )
    papers_total = await db.execute(select(func.count(Paper.id)))
    papers_published_count = papers_published.scalar() or 0
    papers_total_count = papers_total.scalar() or 0
    
    # 专利统计 - 按状态分组  
    patents_authorized = await db.execute(
        select(func.count(Patent.id)).where(Patent.status == "authorized")
    )
    patents_total = await db.execute(select(func.count(Patent.id)))
    patents_authorized_count = patents_authorized.scalar() or 0
    patents_total_count = patents_total.scalar() or 0
    
    # 项目统计 - 按状态分组
    projects_completed = await db.execute(
        select(func.count(Project.id)).where(Project.status == "completed")
    )
    projects_total = await db.execute(select(func.count(Project.id)))
    projects_completed_count = projects_completed.scalar() or 0
    projects_total_count = projects_total.scalar() or 0
    
    # 软著统计 - 按状态分组
    software_registered = await db.execute(
        select(func.count(SoftwareCopyright.id)).where(SoftwareCopyright.status == "registered")
    )
    software_total = await db.execute(select(func.count(SoftwareCopyright.id)))
    software_registered_count = software_registered.scalar() or 0
    software_total_count = software_total.scalar() or 0
    
    # 竞赛统计 - 按状态分组
    competitions_completed = await db.execute(
        select(func.count(Competition.id)).where(Competition.status == "completed")
    )
    competitions_total = await db.execute(select(func.count(Competition.id)))
    competitions_completed_count = competitions_completed.scalar() or 0
    competitions_total_count = competitions_total.scalar() or 0
    
    # 会议统计 - 按提交状态分组
    conferences_accepted = await db.execute(
        select(func.count(Conference.id)).where(Conference.submission_status == "accepted")
    )
    conferences_total = await db.execute(select(func.count(Conference.id)))
    conferences_accepted_count = conferences_accepted.scalar() or 0
    conferences_total_count = conferences_total.scalar() or 0
    
    # 合作统计 - 按状态分组
    cooperations_active = await db.execute(
        select(func.count(Cooperation.id)).where(Cooperation.status == "in_progress")
    )
    cooperations_total = await db.execute(select(func.count(Cooperation.id)))
    cooperations_active_count = cooperations_active.scalar() or 0
    cooperations_total_count = cooperations_total.scalar() or 0
    
    # 计算完成率（避免除零错误）
    def calc_completion(completed, total):
        return int((completed / total * 100)) if total > 0 else 0
    
    return {
        "papers": {
            "current": papers_published_count,
            "target": papers_total_count,
            "completion": calc_completion(papers_published_count, papers_total_count),
            "label": "已发表/总数"
        },
        "patents": {
            "current": patents_authorized_count,
            "target": patents_total_count, 
            "completion": calc_completion(patents_authorized_count, patents_total_count),
            "label": "已授权/总数"
        },
        "projects": {
            "current": projects_completed_count,
            "target": projects_total_count,
            "completion": calc_completion(projects_completed_count, projects_total_count),
            "label": "已完成/总数"
        },
        "software": {
            "current": software_registered_count,
            "target": software_total_count,
            "completion": calc_completion(software_registered_count, software_total_count),
            "label": "已登记/总数"
        },
        "competitions": {
            "current": competitions_completed_count,
            "target": competitions_total_count,
            "completion": calc_completion(competitions_completed_count, competitions_total_count),
            "label": "已完成/总数"
        },
        "conferences": {
            "current": conferences_accepted_count,
            "target": conferences_total_count,
            "completion": calc_completion(conferences_accepted_count, conferences_total_count),
            "label": "已接收/总数"
        },
        "cooperations": {
            "current": cooperations_active_count,
            "target": cooperations_total_count,
            "completion": calc_completion(cooperations_active_count, cooperations_total_count),
            "label": "进行中/总数"
        },
    }


@router.get("/overview")
async def get_dashboard_overview(db: AsyncSession = Depends(get_session)) -> Any:
    """获取仪表盘概览数据"""
    # 获取各模块统计
    paper_stats = await crud_paper.get_stats(db)
    patent_stats = await crud_patent.get_stats(db)
    project_stats = await crud_project.get_stats(db)
    resource_stats = await crud_resource.get_stats(db)
    software_stats = await crud_software_copyright.get_stats(db)
    competition_stats = await crud_competition.get_stats(db)
    conference_stats = await crud_conference.get_stats(db)
    cooperation_stats = await crud_cooperation.get_stats(db)
    
    return {
        "research_overview": [
            StatsResponse(label="论文", value=paper_stats["total"], change="+12", trend="up"),
            StatsResponse(label="专利", value=patent_stats["total"], change="+5", trend="up"),
            StatsResponse(label="软著", value=software_stats["total"], change="+2", trend="up"),
            StatsResponse(label="项目", value=project_stats["total"], change="+3", trend="up"),
            StatsResponse(label="比赛", value=competition_stats["total"], change="+4", trend="up"),
            StatsResponse(label="会议", value=conference_stats["total"], change="+3", trend="up"),
            StatsResponse(label="合作", value=cooperation_stats["total"], change="+2", trend="up"),
            StatsResponse(label="资源", value=resource_stats["total"], change="+8", trend="up"),
        ],
        "trend_data": await get_monthly_trends(db),
        "achievement_stats": await get_achievement_stats(db),
    }


@router.get("/recent-achievements")
async def get_recent_achievements(
    page: int = 1,
    size: int = 10,
    db: AsyncSession = Depends(get_session),
) -> Any:
    """获取最新成果（支持分页）"""
    achievements = []
    
    # 获取足够多的数据以便全局排序，每个模块获取50条数据
    batch_size = 50
    
    # 获取最新论文
    recent_papers = await crud_paper.get_multi(db, skip=0, limit=batch_size)
    for paper in recent_papers:
        achievements.append({
            "id": str(paper.id),
            "type": "paper",
            "title": paper.title,
            "status": paper.status,
            "date": paper.created_at.isoformat(),
            "description": f"论文 - {paper.journal or '未指定期刊'}",
        })
    
    # 获取最新项目
    recent_projects = await crud_project.get_multi(db, skip=0, limit=batch_size)
    for project in recent_projects:
        achievements.append({
            "id": str(project.id),
            "type": "project",
            "title": project.name,
            "status": project.status,
            "date": project.created_at.isoformat(),
            "description": f"项目 - {project.project_type}",
        })
    
    # 获取最新专利
    recent_patents = await crud_patent.get_multi(db, skip=0, limit=batch_size)
    for patent in recent_patents:
        achievements.append({
            "id": str(patent.id),
            "type": "patent",
            "title": patent.name,
            "status": patent.status,
            "date": patent.created_at.isoformat(),
            "description": f"专利 - {patent.patent_type}",
        })
    
    # 获取最新软著
    recent_software = await crud_software_copyright.get_multi(db, skip=0, limit=batch_size)
    for software in recent_software:
        achievements.append({
            "id": str(software.id),
            "type": "software",
            "title": software.name,
            "status": software.status,
            "date": software.created_at.isoformat(),
            "description": f"软著 - {software.version}",
        })
    
    # 获取最新竞赛
    recent_competitions = await crud_competition.get_multi(db, skip=0, limit=batch_size)
    for competition in recent_competitions:
        achievements.append({
            "id": str(competition.id),
            "type": "competition",
            "title": competition.name,
            "status": competition.status,
            "date": competition.created_at.isoformat(),
            "description": f"竞赛 - {competition.level} - {competition.award_level or '进行中'}",
        })
    
    # 获取最新会议
    recent_conferences = await crud_conference.get_multi(db, skip=0, limit=batch_size)
    for conference in recent_conferences:
        achievements.append({
            "id": str(conference.id),
            "type": "conference",
            "title": conference.name,
            "status": conference.submission_status or "planned",
            "date": conference.created_at.isoformat(),
            "description": f"会议 - {conference.level} - {conference.location}",
        })
    
    # 获取最新合作
    recent_cooperations = await crud_cooperation.get_multi(db, skip=0, limit=batch_size)
    for cooperation in recent_cooperations:
        achievements.append({
            "id": str(cooperation.id),
            "type": "cooperation",
            "title": cooperation.organization,
            "status": cooperation.status,
            "date": cooperation.created_at.isoformat(),
            "description": f"合作 - {cooperation.cooperation_type}",
        })
    
    # 按日期全局排序
    achievements.sort(key=lambda x: x["date"], reverse=True)
    
    # 计算分页
    total = len(achievements)
    max_pages = 6  # 限制最多6页
    total_pages = min(max_pages, (total + size - 1) // size)  # 向上取整，但不超过6页
    
    # 限制页数
    if page > max_pages:
        page = max_pages
    
    start = (page - 1) * size
    end = start + size
    paginated_achievements = achievements[start:end]
    
    return {
        "items": paginated_achievements,
        "total": total,
        "page": page,
        "size": size,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_prev": page > 1,
    }

from typing import Any
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func, select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import get_session
from app.api.deps import get_current_user
from app.models.tables import User

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
) -> Any:
    """获取未读通知数量"""
    
    # 这里可以根据实际的通知表来查询
    # 暂时返回一个基于系统活动的模拟值
    
    try:
        # 可以基于最近的系统活动来模拟通知数量
        # 比如：最近24小时创建的记录数量
        from app.models.tables import Paper, Project, Patent
        
        now = datetime.now()
        yesterday = now - timedelta(days=1)
        
        # 统计最近24小时的新增内容
        papers_query = select(func.count(Paper.id)).where(
            Paper.created_at >= yesterday
        )
        recent_papers = (await db.execute(papers_query)).scalar() or 0
        
        projects_query = select(func.count(Project.id)).where(
            Project.created_at >= yesterday
        )
        recent_projects = (await db.execute(projects_query)).scalar() or 0
        
        patents_query = select(func.count(Patent.id)).where(
            Patent.created_at >= yesterday
        )
        recent_patents = (await db.execute(patents_query)).scalar() or 0
        
        # 计算通知数量（新增内容可能生成通知）
        notification_count = recent_papers + recent_projects + recent_patents
        
        return {
            "count": min(notification_count, 99),  # 最多显示99
            "has_unread": notification_count > 0
        }
        
    except Exception as e:
        # 如果查询失败，返回0
        return {
            "count": 0,
            "has_unread": False,
            "error": str(e)
        }


@router.get("/list")
async def get_notifications(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
) -> Any:
    """获取通知列表（未来可扩展）"""
    
    # 这是一个占位API，未来可以实现真正的通知系统
    # 目前返回基于最近活动的模拟通知
    
    try:
        from app.models.tables import Paper, Project, Patent
        
        notifications = []
        
        # 获取最近的论文
        papers_query = select(Paper).order_by(Paper.created_at.desc()).limit(5)
        papers_result = await db.execute(papers_query)
        papers = papers_result.scalars().all()
        
        for paper in papers:
            notifications.append({
                "id": f"paper_{paper.id}",
                "type": "paper",
                "title": f"新增论文: {paper.title}",
                "message": f"论文《{paper.title}》已添加到系统",
                "created_at": paper.created_at.isoformat() if paper.created_at else None,
                "read": False
            })
        
        # 获取最近的项目
        projects_query = select(Project).order_by(Project.created_at.desc()).limit(5)
        projects_result = await db.execute(projects_query)
        projects = projects_result.scalars().all()
        
        for project in projects:
            notifications.append({
                "id": f"project_{project.id}",
                "type": "project",
                "title": f"新增项目: {project.name}",
                "message": f"项目《{project.name}》已添加到系统",
                "created_at": project.created_at.isoformat() if project.created_at else None,
                "read": False
            })
        
        # 按时间排序
        notifications.sort(key=lambda x: x["created_at"] or "", reverse=True)
        
        return {
            "notifications": notifications[skip:skip+limit],
            "total": len(notifications)
        }
        
    except Exception as e:
        return {
            "notifications": [],
            "total": 0,
            "error": str(e)
        }

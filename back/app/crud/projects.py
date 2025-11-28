from typing import Dict

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.base import CRUDBase
from app.models.tables import Project, ProjectMilestone
from app.schemas.projects import ProjectCreate, ProjectUpdate


class CRUDProject(CRUDBase[Project, ProjectCreate, ProjectUpdate]):
    async def get_stats(self, db: AsyncSession) -> Dict[str, int]:
        """获取项目统计数据"""
        total_query = select(func.count(self.model.id))
        active_query = select(func.count(self.model.id)).where(self.model.status == "active")
        completed_query = select(func.count(self.model.id)).where(self.model.status == "completed")
        planning_query = select(func.count(self.model.id)).where(self.model.status == "planning")

        total = (await db.execute(total_query)).scalar() or 0
        active = (await db.execute(active_query)).scalar() or 0
        completed = (await db.execute(completed_query)).scalar() or 0
        planning = (await db.execute(planning_query)).scalar() or 0

        return {
            "total": total,
            "active": active,
            "completed": completed,
            "planning": planning,
        }

    async def get_budget_summary(self, db: AsyncSession) -> Dict[str, float]:
        """获取预算汇总"""
        budget_query = select(
            func.sum(self.model.budget).label("total_budget"),
            func.sum(self.model.budget_used).label("total_used")
        )
        
        result = await db.execute(budget_query)
        row = result.first()
        
        total_budget = float(row.total_budget or 0)
        total_used = float(row.total_used or 0)
        
        return {
            "total_budget": total_budget,
            "total_used": total_used,
            "usage_rate": (total_used / total_budget * 100) if total_budget > 0 else 0,
        }

    async def get_milestones(
        self, db: AsyncSession, *, project_id: str, skip: int = 0, limit: int = 100
    ) -> list[ProjectMilestone]:
        """获取项目里程碑"""
        result = await db.execute(
            select(ProjectMilestone)
            .where(ProjectMilestone.project_id == project_id)
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_by_priority(
        self, db: AsyncSession, *, priority: str, skip: int = 0, limit: int = 100
    ) -> list[Project]:
        result = await db.execute(
            select(self.model)
            .where(self.model.priority == priority)
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def search(
        self,
        db: AsyncSession,
        *,
        query: str,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Project]:
        """搜索项目"""
        search_query = select(self.model).where(
            self.model.name.ilike(f"%{query}%") |
            self.model.description.ilike(f"%{query}%")
        ).offset(skip).limit(limit)
        
        result = await db.execute(search_query)
        return list(result.scalars().all())


crud_project = CRUDProject(Project)

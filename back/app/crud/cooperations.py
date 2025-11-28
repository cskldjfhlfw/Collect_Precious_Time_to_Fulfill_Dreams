from typing import Dict
from sqlalchemy import func, select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.base import CRUDBase
from app.models.tables import Cooperation
from app.schemas.cooperations import CooperationCreate, CooperationUpdate


class CRUDCooperation(CRUDBase[Cooperation, CooperationCreate, CooperationUpdate]):
    async def get_stats(self, db: AsyncSession) -> Dict[str, int]:
        """获取合作统计数据"""
        total_query = select(func.count(self.model.id))
        total = (await db.execute(total_query)).scalar() or 0
        
        # 根据状态统计
        ongoing_query = select(func.count(self.model.id)).where(
            self.model.status == "active"
        )
        ongoing = (await db.execute(ongoing_query)).scalar() or 0
        
        completed_query = select(func.count(self.model.id)).where(
            self.model.status == "completed"
        )
        completed = (await db.execute(completed_query)).scalar() or 0
        
        planning_query = select(func.count(self.model.id)).where(
            self.model.status == "negotiating"
        )
        planning = (await db.execute(planning_query)).scalar() or 0
        
        return {
            "total": total,
            "ongoing": ongoing,
            "completed": completed,
            "planning": planning,
        }

    async def search(
        self,
        db: AsyncSession,
        *,
        query: str,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Cooperation]:
        """搜索合作"""
        search_query = select(self.model).where(
            or_(
                func.coalesce(self.model.organization, '').ilike(f"%{query}%"),
                func.coalesce(self.model.content, '').ilike(f"%{query}%")
            )
        ).offset(skip).limit(limit)
        
        result = await db.execute(search_query)
        return list(result.scalars().all())


crud_cooperation = CRUDCooperation(Cooperation)

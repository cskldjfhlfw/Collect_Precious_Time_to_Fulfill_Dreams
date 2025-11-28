from typing import Dict
from sqlalchemy import func, select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.base import CRUDBase
from app.models.tables import Conference
from app.schemas.conferences import ConferenceCreate, ConferenceUpdate


class CRUDConference(CRUDBase[Conference, ConferenceCreate, ConferenceUpdate]):
    async def get_stats(self, db: AsyncSession) -> Dict[str, int]:
        """获取会议统计数据"""
        total_query = select(func.count(self.model.id))
        total = (await db.execute(total_query)).scalar() or 0
        
        # 根据participation_type统计
        attended_query = select(func.count(self.model.id)).where(
            self.model.participation_type == "attended"
        )
        attended = (await db.execute(attended_query)).scalar() or 0
        
        planned_query = select(func.count(self.model.id)).where(
            self.model.participation_type == "planned"
        )
        planned = (await db.execute(planned_query)).scalar() or 0
        
        completed_query = select(func.count(self.model.id)).where(
            self.model.participation_type == "completed"
        )
        completed = (await db.execute(completed_query)).scalar() or 0
        
        return {
            "total": total,
            "attended": attended,
            "planned": planned,
            "completed": completed,
        }

    async def search(
        self,
        db: AsyncSession,
        *,
        query: str,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Conference]:
        """搜索会议"""
        search_query = select(self.model).where(
            or_(
                func.coalesce(self.model.name, '').ilike(f"%{query}%"),
                func.coalesce(self.model.location, '').ilike(f"%{query}%")
            )
        ).offset(skip).limit(limit)
        
        result = await db.execute(search_query)
        return list(result.scalars().all())


crud_conference = CRUDConference(Conference)

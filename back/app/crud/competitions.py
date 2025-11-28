from typing import Dict
from sqlalchemy import func, select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.base import CRUDBase
from app.models.tables import Competition
from app.schemas.competitions import CompetitionCreate, CompetitionUpdate


class CRUDCompetition(CRUDBase[Competition, CompetitionCreate, CompetitionUpdate]):
    async def get_stats(self, db: AsyncSession) -> Dict[str, int]:
        """获取比赛统计数据"""
        total_query = select(func.count(self.model.id))
        
        # 根据状态统计
        status_mapping = {
            "total": None,
            "awarded": "completed",  # 获奖数量
            "ongoing": "ongoing",     # 进行中
            "planning": "planning"    # 待报名
        }
        
        stats = {}
        for key, status_value in status_mapping.items():
            if status_value is None:
                query = select(func.count(self.model.id))
            else:
                query = select(func.count(self.model.id)).where(self.model.status == status_value)
            
            result = await db.execute(query)
            stats[key] = result.scalar() or 0
        
        # 计算获奖数量（有award_level的记录）
        awarded_query = select(func.count(self.model.id)).where(self.model.award_level.isnot(None))
        awarded_result = await db.execute(awarded_query)
        stats["awarded"] = awarded_result.scalar() or 0
        
        return stats

    async def search(
        self,
        db: AsyncSession,
        *,
        query: str,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Competition]:
        """搜索比赛 - 支持多字段模糊搜索"""
        search_query = select(self.model).where(or_(
            func.coalesce(self.model.name, '').ilike(f"%{query}%"),
            func.coalesce(self.model.level, '').ilike(f"%{query}%"),
            func.coalesce(self.model.status, '').ilike(f"%{query}%"),
            func.coalesce(self.model.mentor, '').ilike(f"%{query}%")
        )).offset(skip).limit(limit)
        
        result = await db.execute(search_query)
        return list(result.scalars().all())


crud_competition = CRUDCompetition(Competition)

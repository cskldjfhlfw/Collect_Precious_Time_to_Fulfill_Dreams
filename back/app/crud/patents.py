from typing import Dict

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.base import CRUDBase
from app.models.tables import Patent
from app.schemas.patents import PatentCreate, PatentUpdate


class CRUDPatent(CRUDBase[Patent, PatentCreate, PatentUpdate]):
    async def get_stats(self, db: AsyncSession) -> Dict[str, int]:
        """获取专利统计数据"""
        total_query = select(func.count(self.model.id))
        authorized_query = select(func.count(self.model.id)).where(self.model.status == "authorized")
        pending_query = select(func.count(self.model.id)).where(self.model.status == "pending")
        maintenance_query = select(func.count(self.model.id)).where(self.model.status == "maintenance")

        total = (await db.execute(total_query)).scalar() or 0
        authorized = (await db.execute(authorized_query)).scalar() or 0
        pending = (await db.execute(pending_query)).scalar() or 0
        maintenance = (await db.execute(maintenance_query)).scalar() or 0

        return {
            "total": total,
            "authorized": authorized,
            "pending": pending,
            "maintenance": maintenance,
        }

    async def get_by_technology_field(
        self, db: AsyncSession, *, field: str, skip: int = 0, limit: int = 100
    ) -> list[Patent]:
        result = await db.execute(
            select(self.model)
            .where(self.model.technology_field == field)
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_maintenance_reminders(
        self, db: AsyncSession, *, days_ahead: int = 30
    ) -> list[Patent]:
        """获取需要维护提醒的专利"""
        from datetime import date, timedelta
        
        reminder_date = date.today() + timedelta(days=days_ahead)
        
        result = await db.execute(
            select(self.model)
            .where(
                self.model.maintenance_deadline.is_not(None),
                self.model.maintenance_deadline <= reminder_date,
                self.model.status == "authorized"
            )
        )
        return list(result.scalars().all())

    async def search(
        self,
        db: AsyncSession,
        *,
        query: str,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Patent]:
        """搜索专利"""
        search_query = select(self.model).where(
            self.model.name.ilike(f"%{query}%") |
            self.model.patent_number.ilike(f"%{query}%") |
            self.model.technology_field.ilike(f"%{query}%")
        ).offset(skip).limit(limit)
        
        result = await db.execute(search_query)
        return list(result.scalars().all())


crud_patent = CRUDPatent(Patent)

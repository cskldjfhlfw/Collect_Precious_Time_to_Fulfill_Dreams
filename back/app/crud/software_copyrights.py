from typing import Dict
from sqlalchemy import func, select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.base import CRUDBase
from app.models.tables import SoftwareCopyright
from app.schemas.software_copyrights import SoftwareCopyrightCreate, SoftwareCopyrightUpdate


class CRUDSoftwareCopyright(CRUDBase[SoftwareCopyright, SoftwareCopyrightCreate, SoftwareCopyrightUpdate]):
    async def get_stats(self, db: AsyncSession) -> Dict[str, int]:
        """获取软著统计数据"""
        total_query = select(func.count(self.model.id))
        total = (await db.execute(total_query)).scalar() or 0
        
        # 根据状态统计
        registered_query = select(func.count(self.model.id)).where(
            self.model.status == "registered"
        )
        registered = (await db.execute(registered_query)).scalar() or 0
        
        pending_query = select(func.count(self.model.id)).where(
            self.model.status == "pending"
        )
        pending = (await db.execute(pending_query)).scalar() or 0
        
        update_needed_query = select(func.count(self.model.id)).where(
            self.model.status == "update_needed"
        )
        update_needed = (await db.execute(update_needed_query)).scalar() or 0
        
        return {
            "total": total,
            "registered": registered,
            "pending": pending,
            "update_needed": update_needed,
        }

    async def search(
        self,
        db: AsyncSession,
        *,
        query: str,
        skip: int = 0,
        limit: int = 100,
    ) -> list[SoftwareCopyright]:
        """搜索软著"""
        search_query = select(self.model).where(
            or_(
                func.coalesce(self.model.name, '').ilike(f"%{query}%"),
                func.coalesce(self.model.registration_number, '').ilike(f"%{query}%")
            )
        ).offset(skip).limit(limit)
        
        result = await db.execute(search_query)
        return list(result.scalars().all())


crud_software_copyright = CRUDSoftwareCopyright(SoftwareCopyright)

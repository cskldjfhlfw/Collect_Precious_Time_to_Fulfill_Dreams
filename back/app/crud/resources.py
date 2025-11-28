from typing import Dict
from sqlalchemy import func, select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.base import CRUDBase
from app.models.tables import Resource, ResourceUsageLog
from app.schemas.resources import ResourceCreate, ResourceUpdate


class CRUDResource(CRUDBase[Resource, ResourceCreate, ResourceUpdate]):
    async def get_stats(self, db: AsyncSession) -> Dict[str, int]:
        """获取资源统计数据"""
        total_query = select(func.count(self.model.id))
        public_query = select(func.count(self.model.id)).where(self.model.is_public == True)
        private_query = select(func.count(self.model.id)).where(self.model.is_public == False)
        # 活跃资源 - 使用率大于0的资源
        active_query = select(func.count(self.model.id)).where(self.model.usage_rate > 0)
        
        # 按类型统计
        type_query = select(
            self.model.resource_type,
            func.count(self.model.id).label("count")
        ).group_by(self.model.resource_type)

        total = (await db.execute(total_query)).scalar() or 0
        public = (await db.execute(public_query)).scalar() or 0
        private = (await db.execute(private_query)).scalar() or 0
        active = (await db.execute(active_query)).scalar() or 0
        
        type_result = await db.execute(type_query)
        type_stats = {row.resource_type: row.count for row in type_result}

        return {
            "total": total,
            "public": public,
            "private": private,
            "active": active,
            "by_type": type_stats,
        }

    async def get_by_type(
        self, db: AsyncSession, *, resource_type: str, skip: int = 0, limit: int = 100
    ) -> list[Resource]:
        result = await db.execute(
            select(self.model)
            .where(self.model.resource_type == resource_type)
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_maintenance_due(
        self, db: AsyncSession, *, days_ahead: int = 7
    ) -> list[Resource]:
        """获取需要维护的资源"""
        from datetime import date, timedelta
        
        due_date = date.today() + timedelta(days=days_ahead)
        
        result = await db.execute(
            select(self.model)
            .where(
                self.model.next_maintenance_date.is_not(None),
                self.model.next_maintenance_date <= due_date
            )
        )
        return list(result.scalars().all())

    async def get_usage_logs(
        self, db: AsyncSession, *, resource_id: str, skip: int = 0, limit: int = 100
    ) -> list[ResourceUsageLog]:
        """获取资源使用记录"""
        result = await db.execute(
            select(ResourceUsageLog)
            .where(ResourceUsageLog.resource_id == resource_id)
            .order_by(ResourceUsageLog.usage_date.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def update_download_count(
        self, db: AsyncSession, *, resource_id: str
    ) -> None:
        """更新下载次数"""
        resource = await self.get(db, resource_id)
        if resource:
            resource.download_count += 1
            db.add(resource)
            await db.commit()

    async def search(
        self,
        db: AsyncSession,
        *,
        query: str,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Resource]:
        """搜索资源"""
        search_query = select(self.model).where(
            or_(
                func.coalesce(self.model.name, '').ilike(f"%{query}%"),
                func.coalesce(self.model.description, '').ilike(f"%{query}%"),
                func.coalesce(self.model.resource_type, '').ilike(f"%{query}%")
            )
        ).offset(skip).limit(limit)
        
        result = await db.execute(search_query)
        return list(result.scalars().all())


crud_resource = CRUDResource(Resource)

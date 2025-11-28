from typing import Dict, List, Optional
from uuid import UUID

from sqlalchemy import func, select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.base import CRUDBase
from app.models.tables import Paper, PaperAuthor
from app.schemas.papers import PaperCreate, PaperUpdate


class CRUDPaper(CRUDBase[Paper, PaperCreate, PaperUpdate]):
    async def get_by_status(
        self, db: AsyncSession, *, status: str, skip: int = 0, limit: int = 100
    ) -> list[Paper]:
        result = await db.execute(
            select(self.model)
            .where(self.model.status == status)
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_stats(self, db: AsyncSession) -> Dict[str, int]:
        """获取论文统计数据"""
        total_query = select(func.count(self.model.id))
        published_query = select(func.count(self.model.id)).where(self.model.status == "published")
        reviewing_query = select(func.count(self.model.id)).where(self.model.status == "reviewing")
        draft_query = select(func.count(self.model.id)).where(self.model.status == "draft")

        total = (await db.execute(total_query)).scalar() or 0
        published = (await db.execute(published_query)).scalar() or 0
        reviewing = (await db.execute(reviewing_query)).scalar() or 0
        draft = (await db.execute(draft_query)).scalar() or 0

        return {
            "total": total,
            "published": published,
            "reviewing": reviewing,
            "draft": draft,
        }

    async def get_author_contributions(
        self, db: AsyncSession, *, limit: int = 10
    ) -> list[dict]:
        """获取作者贡献统计"""
        query = (
            select(
                PaperAuthor.author_name,
                func.count(PaperAuthor.paper_id).label("paper_count"),
                func.avg(PaperAuthor.contribution_level).label("avg_contribution")
            )
            .group_by(PaperAuthor.author_name)
            .order_by(func.count(PaperAuthor.paper_id).desc())
            .limit(limit)
        )
        
        result = await db.execute(query)
        return [
            {
                "author_name": row.author_name,
                "paper_count": row.paper_count,
                "contribution_percent": int(row.avg_contribution or 0),
            }
            for row in result
        ]

    async def search(
        self,
        db: AsyncSession,
        *,
        query: str,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Paper]:
        """搜索论文"""
        search_query = select(self.model).where(
            or_(
                func.coalesce(self.model.title, '').ilike(f"%{query}%"),
                func.coalesce(self.model.abstract, '').ilike(f"%{query}%")
            )
        ).offset(skip).limit(limit)
        
        result = await db.execute(search_query)
        return list(result.scalars().all())


crud_paper = CRUDPaper(Paper)

"""论文文档服务（MongoDB）"""
from typing import Optional, List, Dict, Any
from datetime import datetime

from app.services.mongodb_base import MongoDBBaseService
from app.core.config import settings


class PaperDocumentService(MongoDBBaseService):
    """论文文档服务类"""
    
    def __init__(self):
        super().__init__("papers")
    
    async def create_paper_document(
        self,
        paper_id: str,
        title: str,
        full_text: str,
        abstract: Optional[str] = None,
        sections: Optional[List[Dict]] = None,
        figures: Optional[List[Dict]] = None,
        references: Optional[List[str]] = None,
        metadata: Optional[Dict] = None
    ) -> str:
        """创建论文文档
        
        Args:
            paper_id: PostgreSQL中的论文ID
            title: 论文标题
            full_text: 论文全文
            abstract: 摘要
            sections: 章节列表 [{"title": "...", "content": "..."}]
            figures: 图片列表 [{"number": 1, "caption": "...", "url": "..."}]
            references: 参考文献列表
            metadata: 元数据 {"word_count": 8500, "page_count": 12}
            
        Returns:
            MongoDB文档ID
        """
        doc = {
            "paper_id": paper_id,
            "title": title,
            "full_text": full_text,
            "abstract": abstract or "",
            "sections": sections or [],
            "figures": figures or [],
            "references": references or [],
            "metadata": metadata or {},
        }
        
        return await self.create(doc)
    
    async def get_paper_document(self, paper_id: str) -> Optional[Dict]:
        """根据论文ID获取文档
        
        Args:
            paper_id: PostgreSQL中的论文ID
            
        Returns:
            论文文档或None
        """
        return await self.find_one({"paper_id": paper_id})
    
    async def update_paper_document(
        self,
        paper_id: str,
        **kwargs
    ) -> bool:
        """更新论文文档
        
        Args:
            paper_id: PostgreSQL中的论文ID
            **kwargs: 要更新的字段
            
        Returns:
            是否更新成功
        """
        # 过滤None值
        update_data = {k: v for k, v in kwargs.items() if v is not None}
        
        if not update_data:
            return False
        
        return await self.update_by_query(
            {"paper_id": paper_id},
            update_data
        ) > 0
    
    async def delete_paper_document(self, paper_id: str) -> bool:
        """删除论文文档
        
        Args:
            paper_id: PostgreSQL中的论文ID
            
        Returns:
            是否删除成功
        """
        return await self.delete_by_query({"paper_id": paper_id}) > 0
    
    async def search_full_text(
        self,
        query: str,
        limit: int = 10
    ) -> List[Dict]:
        """全文搜索论文
        
        Args:
            query: 搜索关键词
            limit: 返回数量限制
            
        Returns:
            匹配的论文列表（按相关性排序）
        """
        if not settings.mongo_enabled:
            return []
        
        try:
            # MongoDB全文搜索
            cursor = self.collection.find(
                {"$text": {"$search": query}},
                {"score": {"$meta": "textScore"}}
            ).sort([("score", {"$meta": "textScore"})]).limit(limit)
            
            docs = await cursor.to_list(length=limit)
            for doc in docs:
                doc["_id"] = str(doc["_id"])
            
            return docs
        except Exception as e:
            print(f"全文搜索失败: {e}")
            return []
    
    async def get_paper_sections(self, paper_id: str) -> List[Dict]:
        """获取论文章节
        
        Args:
            paper_id: 论文ID
            
        Returns:
            章节列表
        """
        doc = await self.get_paper_document(paper_id)
        return doc.get("sections", []) if doc else []
    
    async def get_paper_statistics(self) -> Dict:
        """获取论文文档统计
        
        Returns:
            统计信息
        """
        total = await self.count()
        
        # 聚合统计
        pipeline = [
            {
                "$group": {
                    "_id": None,
                    "total_papers": {"$sum": 1},
                    "avg_word_count": {"$avg": "$metadata.word_count"},
                    "total_figures": {"$sum": {"$size": "$figures"}},
                    "total_sections": {"$sum": {"$size": "$sections"}}
                }
            }
        ]
        
        try:
            cursor = self.collection.aggregate(pipeline)
            results = await cursor.to_list(length=1)
            
            if results:
                stats = results[0]
                stats.pop("_id", None)
                return stats
        except Exception as e:
            print(f"统计失败: {e}")
        
        return {
            "total_papers": total,
            "avg_word_count": 0,
            "total_figures": 0,
            "total_sections": 0
        }
    
    async def create_text_index(self):
        """创建全文搜索索引"""
        try:
            await self.collection.create_index([
                ("title", "text"),
                ("full_text", "text"),
                ("abstract", "text")
            ], name="text_search_index")
            print("✅ 论文全文搜索索引创建成功")
            return True
        except Exception as e:
            print(f"❌ 创建索引失败: {e}")
            return False


# 创建全局实例
paper_document_service = PaperDocumentService()

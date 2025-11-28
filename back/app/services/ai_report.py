"""AI报表存储服务（MongoDB）"""
from typing import Optional, List, Dict, Any
from datetime import datetime

from app.services.mongodb_base import MongoDBBaseService
from app.core.config import settings


class AIReportService(MongoDBBaseService):
    """AI报表存储服务类"""
    
    def __init__(self):
        super().__init__("ai_reports")
    
    async def create_report(
        self,
        report_type: str,
        report_format: str,
        ai_content: str,
        statistics: Dict,
        time_range: Dict,
        user_id: Optional[str] = None,
        raw_data: Optional[Dict] = None
    ) -> str:
        """保存AI生成的报表
        
        Args:
            report_type: 报告类型（月度报告、季度总结等）
            report_format: 报告格式（详细版、简洁版等）
            ai_content: AI生成的报告内容
            statistics: 统计数据摘要
            time_range: 时间范围
            user_id: 生成用户ID
            raw_data: 原始数据
            
        Returns:
            MongoDB文档ID
        """
        doc = {
            "report_type": report_type,
            "report_format": report_format,
            "ai_content": ai_content,
            "statistics": statistics,
            "time_range": time_range,
            "user_id": user_id,
            "raw_data": raw_data or {},
            "word_count": len(ai_content),
            "generated_at": datetime.now(),
        }
        
        return await self.create(doc)
    
    async def get_report(self, report_id: str) -> Optional[Dict]:
        """获取单个报表
        
        Args:
            report_id: 报表ID
            
        Returns:
            报表文档
        """
        return await self.find_by_id(report_id)
    
    async def get_recent_reports(
        self,
        limit: int = 20,
        report_type: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> List[Dict]:
        """获取最近的报表列表
        
        Args:
            limit: 返回数量
            report_type: 筛选报告类型
            user_id: 筛选用户ID
            
        Returns:
            报表列表（按时间倒序）
        """
        query = {}
        
        if report_type:
            query["report_type"] = report_type
        
        if user_id:
            query["user_id"] = user_id
        
        return await self.find_many(
            query=query,
            skip=0,
            limit=limit,
            sort=[("generated_at", -1)]  # 按生成时间倒序
        )
    
    async def search_reports(
        self,
        keyword: str,
        limit: int = 10
    ) -> List[Dict]:
        """搜索报表内容
        
        Args:
            keyword: 搜索关键词
            limit: 返回数量
            
        Returns:
            匹配的报表列表
        """
        if not settings.mongo_enabled:
            return []
        
        try:
            # MongoDB文本搜索
            cursor = self.collection.find(
                {"$text": {"$search": keyword}},
                {"score": {"$meta": "textScore"}}
            ).sort([("score", {"$meta": "textScore"})]).limit(limit)
            
            docs = await cursor.to_list(length=limit)
            for doc in docs:
                doc["_id"] = str(doc["_id"])
            
            return docs
        except Exception as e:
            print(f"报表搜索失败: {e}")
            return []
    
    async def get_report_statistics(self) -> Dict:
        """获取报表统计信息
        
        Returns:
            统计数据
        """
        total = await self.count()
        
        # 聚合统计
        pipeline = [
            {
                "$group": {
                    "_id": "$report_type",
                    "count": {"$sum": 1},
                    "avg_word_count": {"$avg": "$word_count"}
                }
            }
        ]
        
        try:
            cursor = self.collection.aggregate(pipeline)
            results = await cursor.to_list(length=None)
            
            by_type = {}
            for item in results:
                by_type[item["_id"]] = {
                    "count": item["count"],
                    "avg_word_count": int(item.get("avg_word_count", 0))
                }
            
            return {
                "total_reports": total,
                "by_type": by_type
            }
        except Exception as e:
            print(f"统计失败: {e}")
            return {"total_reports": total, "by_type": {}}
    
    async def delete_report(self, report_id: str) -> bool:
        """删除报表
        
        Args:
            report_id: 报表ID
            
        Returns:
            是否删除成功
        """
        return await self.delete(report_id)
    
    async def create_text_index(self):
        """创建全文搜索索引"""
        try:
            await self.collection.create_index([
                ("ai_content", "text"),
                ("report_type", "text")
            ], name="report_text_search")
            print("✅ 报表全文搜索索引创建成功")
            return True
        except Exception as e:
            print(f"❌ 创建索引失败: {e}")
            return False


# 创建全局实例
ai_report_service = AIReportService()

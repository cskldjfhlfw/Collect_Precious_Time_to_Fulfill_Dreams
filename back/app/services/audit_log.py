"""操作日志服务（MongoDB）"""
from typing import Optional, List, Dict, Any
from datetime import datetime

from app.services.mongodb_base import MongoDBBaseService
from app.core.config import settings


class AuditLogService(MongoDBBaseService):
    """操作日志服务类"""
    
    def __init__(self):
        super().__init__("audit_logs")
    
    async def log_action(
        self,
        user_id: str,
        action: str,
        resource_type: str,
        resource_id: Optional[str] = None,
        changes: Optional[Dict] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        status: str = "success",
        error_message: Optional[str] = None
    ) -> str:
        """记录操作日志
        
        Args:
            user_id: 用户ID
            action: 操作类型（create/update/delete/view/export等）
            resource_type: 资源类型（paper/project/patent等）
            resource_id: 资源ID
            changes: 数据变更详情 {"before": {...}, "after": {...}}
            ip_address: IP地址
            user_agent: 用户代理
            status: 操作状态（success/failed）
            error_message: 错误信息
            
        Returns:
            MongoDB文档ID
        """
        doc = {
            "user_id": user_id,
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "changes": changes or {},
            "ip_address": ip_address,
            "user_agent": user_agent,
            "status": status,
            "error_message": error_message,
            "timestamp": datetime.now(),
        }
        
        return await self.create(doc)
    
    async def get_user_logs(
        self,
        user_id: str,
        limit: int = 50,
        skip: int = 0,
        action: Optional[str] = None,
        resource_type: Optional[str] = None
    ) -> List[Dict]:
        """获取用户操作日志
        
        Args:
            user_id: 用户ID
            limit: 返回数量
            skip: 跳过数量
            action: 筛选操作类型
            resource_type: 筛选资源类型
            
        Returns:
            日志列表
        """
        query = {"user_id": user_id}
        
        if action:
            query["action"] = action
        
        if resource_type:
            query["resource_type"] = resource_type
        
        return await self.find_many(
            query=query,
            skip=skip,
            limit=limit,
            sort=[("timestamp", -1)]  # 按时间倒序
        )
    
    async def get_resource_logs(
        self,
        resource_type: str,
        resource_id: str,
        limit: int = 50
    ) -> List[Dict]:
        """获取资源操作历史
        
        Args:
            resource_type: 资源类型
            resource_id: 资源ID
            limit: 返回数量
            
        Returns:
            日志列表
        """
        query = {
            "resource_type": resource_type,
            "resource_id": resource_id
        }
        
        return await self.find_many(
            query=query,
            skip=0,
            limit=limit,
            sort=[("timestamp", -1)]
        )
    
    async def get_recent_logs(
        self,
        limit: int = 100,
        action: Optional[str] = None,
        resource_type: Optional[str] = None,
        status: Optional[str] = None
    ) -> List[Dict]:
        """获取最近的操作日志
        
        Args:
            limit: 返回数量
            action: 筛选操作类型
            resource_type: 筛选资源类型
            status: 筛选状态
            
        Returns:
            日志列表
        """
        query = {}
        
        if action:
            query["action"] = action
        
        if resource_type:
            query["resource_type"] = resource_type
            
        if status:
            query["status"] = status
        
        return await self.find_many(
            query=query,
            skip=0,
            limit=limit,
            sort=[("timestamp", -1)]
        )
    
    async def get_statistics(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict:
        """获取日志统计
        
        Args:
            start_date: 开始时间
            end_date: 结束时间
            
        Returns:
            统计数据
        """
        query = {}
        
        if start_date or end_date:
            query["timestamp"] = {}
            if start_date:
                query["timestamp"]["$gte"] = start_date
            if end_date:
                query["timestamp"]["$lte"] = end_date
        
        total = await self.count(query)
        
        # 聚合统计
        pipeline = [
            {"$match": query} if query else {"$match": {}},
            {
                "$group": {
                    "_id": {
                        "action": "$action",
                        "resource_type": "$resource_type"
                    },
                    "count": {"$sum": 1}
                }
            }
        ]
        
        try:
            cursor = self.collection.aggregate(pipeline)
            results = await cursor.to_list(length=None)
            
            by_action = {}
            by_resource = {}
            
            for item in results:
                action = item["_id"]["action"]
                resource = item["_id"]["resource_type"]
                count = item["count"]
                
                by_action[action] = by_action.get(action, 0) + count
                by_resource[resource] = by_resource.get(resource, 0) + count
            
            return {
                "total": total,
                "by_action": by_action,
                "by_resource": by_resource
            }
        except Exception as e:
            print(f"统计失败: {e}")
            return {"total": total, "by_action": {}, "by_resource": {}}
    
    async def search_logs(
        self,
        keyword: str,
        limit: int = 50
    ) -> List[Dict]:
        """搜索日志
        
        Args:
            keyword: 搜索关键词
            limit: 返回数量
            
        Returns:
            匹配的日志列表
        """
        if not settings.mongo_enabled:
            return []
        
        try:
            # 使用正则表达式搜索
            query = {
                "$or": [
                    {"action": {"$regex": keyword, "$options": "i"}},
                    {"resource_type": {"$regex": keyword, "$options": "i"}},
                    {"ip_address": {"$regex": keyword, "$options": "i"}}
                ]
            }
            
            return await self.find_many(
                query=query,
                skip=0,
                limit=limit,
                sort=[("timestamp", -1)]
            )
        except Exception as e:
            print(f"搜索失败: {e}")
            return []
    
    async def clean_old_logs(self, days: int = 90) -> int:
        """清理旧日志
        
        Args:
            days: 保留天数（默认90天）
            
        Returns:
            删除的日志数量
        """
        from datetime import timedelta
        
        cutoff_date = datetime.now() - timedelta(days=days)
        
        query = {"timestamp": {"$lt": cutoff_date}}
        
        return await self.delete_by_query(query)


# 创建全局实例
audit_log_service = AuditLogService()

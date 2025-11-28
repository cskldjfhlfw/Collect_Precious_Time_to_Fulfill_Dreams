"""MongoDB基础服务"""
from motor.motor_asyncio import AsyncIOMotorCollection
from app.db.mongodb import get_database
from app.core.config import settings
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId


class MongoDBBaseService:
    """MongoDB基础服务类"""
    
    def __init__(self, collection_name: str):
        self.collection_name = collection_name
        self._collection: Optional[AsyncIOMotorCollection] = None
    
    @property
    def collection(self) -> AsyncIOMotorCollection:
        """延迟获取collection，确保MongoDB已初始化"""
        if not settings.mongo_enabled:
            raise RuntimeError("MongoDB is disabled in settings")
        
        if self._collection is None:
            self._collection = get_database()[self.collection_name]
        return self._collection
    
    async def create(self, data: Dict[str, Any]) -> str:
        """创建文档
        
        Args:
            data: 文档数据
            
        Returns:
            文档ID
        """
        data["created_at"] = datetime.now()
        data["updated_at"] = datetime.now()
        result = await self.collection.insert_one(data)
        return str(result.inserted_id)
    
    async def find_by_id(self, doc_id: str) -> Optional[Dict]:
        """根据ID查找文档
        
        Args:
            doc_id: 文档ID
            
        Returns:
            文档数据或None
        """
        try:
            doc = await self.collection.find_one({"_id": ObjectId(doc_id)})
            if doc:
                doc["_id"] = str(doc["_id"])
            return doc
        except Exception:
            return None
    
    async def find_one(self, query: Dict[str, Any]) -> Optional[Dict]:
        """查找单个文档
        
        Args:
            query: 查询条件
            
        Returns:
            文档数据或None
        """
        doc = await self.collection.find_one(query)
        if doc:
            doc["_id"] = str(doc["_id"])
        return doc
    
    async def find_many(
        self,
        query: Dict[str, Any],
        skip: int = 0,
        limit: int = 20,
        sort: Optional[List[tuple]] = None
    ) -> List[Dict]:
        """查找多个文档
        
        Args:
            query: 查询条件
            skip: 跳过数量
            limit: 限制数量
            sort: 排序规则
            
        Returns:
            文档列表
        """
        cursor = self.collection.find(query).skip(skip).limit(limit)
        
        if sort:
            cursor = cursor.sort(sort)
        
        docs = await cursor.to_list(length=limit)
        for doc in docs:
            doc["_id"] = str(doc["_id"])
        return docs
    
    async def update(self, doc_id: str, data: Dict[str, Any]) -> bool:
        """更新文档
        
        Args:
            doc_id: 文档ID
            data: 更新数据
            
        Returns:
            是否更新成功
        """
        try:
            data["updated_at"] = datetime.now()
            result = await self.collection.update_one(
                {"_id": ObjectId(doc_id)},
                {"$set": data}
            )
            return result.modified_count > 0
        except Exception:
            return False
    
    async def update_by_query(self, query: Dict[str, Any], data: Dict[str, Any]) -> int:
        """根据查询条件更新文档
        
        Args:
            query: 查询条件
            data: 更新数据
            
        Returns:
            更新的文档数量
        """
        data["updated_at"] = datetime.now()
        result = await self.collection.update_many(
            query,
            {"$set": data}
        )
        return result.modified_count
    
    async def delete(self, doc_id: str) -> bool:
        """删除文档
        
        Args:
            doc_id: 文档ID
            
        Returns:
            是否删除成功
        """
        try:
            result = await self.collection.delete_one({"_id": ObjectId(doc_id)})
            return result.deleted_count > 0
        except Exception:
            return False
    
    async def delete_by_query(self, query: Dict[str, Any]) -> int:
        """根据查询条件删除文档
        
        Args:
            query: 查询条件
            
        Returns:
            删除的文档数量
        """
        result = await self.collection.delete_many(query)
        return result.deleted_count
    
    async def count(self, query: Dict[str, Any] = None) -> int:
        """统计文档数量
        
        Args:
            query: 查询条件
            
        Returns:
            文档数量
        """
        query = query or {}
        return await self.collection.count_documents(query)
    
    async def create_index(self, keys: List[tuple], **kwargs):
        """创建索引
        
        Args:
            keys: 索引键列表
            **kwargs: 其他索引选项
        """
        await self.collection.create_index(keys, **kwargs)

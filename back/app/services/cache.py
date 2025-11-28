"""Redis缓存服务"""
import json
from typing import Any, Optional
from datetime import timedelta

from app.db.redis import get_client
from app.core.config import settings


class CacheService:
    """Redis缓存服务类"""
    
    @staticmethod
    async def get(key: str) -> Optional[Any]:
        """获取缓存数据
        
        Args:
            key: 缓存键
            
        Returns:
            缓存的数据，不存在返回None
        """
        if not settings.redis_enabled:
            return None
            
        try:
            client = get_client()
            value = await client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            print(f"Redis get error: {e}")
            return None
    
    @staticmethod
    async def set(key: str, value: Any, expire: int = 300) -> bool:
        """设置缓存数据
        
        Args:
            key: 缓存键
            value: 要缓存的数据
            expire: 过期时间（秒），默认5分钟
            
        Returns:
            是否设置成功
        """
        if not settings.redis_enabled:
            return False
            
        try:
            client = get_client()
            json_value = json.dumps(value, ensure_ascii=False, default=str)
            await client.setex(key, expire, json_value)
            return True
        except Exception as e:
            print(f"Redis set error: {e}")
            return False
    
    @staticmethod
    async def delete(key: str) -> bool:
        """删除缓存
        
        Args:
            key: 缓存键
            
        Returns:
            是否删除成功
        """
        if not settings.redis_enabled:
            return False
            
        try:
            client = get_client()
            await client.delete(key)
            return True
        except Exception as e:
            print(f"Redis delete error: {e}")
            return False
    
    @staticmethod
    async def delete_pattern(pattern: str) -> int:
        """删除匹配模式的所有缓存
        
        Args:
            pattern: 键的匹配模式，如 "analytics:*"
            
        Returns:
            删除的键数量
        """
        if not settings.redis_enabled:
            return 0
            
        try:
            client = get_client()
            keys = await client.keys(pattern)
            if keys:
                return await client.delete(*keys)
            return 0
        except Exception as e:
            print(f"Redis delete pattern error: {e}")
            return 0
    
    @staticmethod
    async def exists(key: str) -> bool:
        """检查缓存是否存在
        
        Args:
            key: 缓存键
            
        Returns:
            缓存是否存在
        """
        if not settings.redis_enabled:
            return False
            
        try:
            client = get_client()
            return await client.exists(key) > 0
        except Exception as e:
            print(f"Redis exists error: {e}")
            return False


# 创建全局实例
cache_service = CacheService()

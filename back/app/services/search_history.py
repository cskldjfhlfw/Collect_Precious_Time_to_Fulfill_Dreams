"""搜索历史和热词服务"""
from typing import List, Optional, Tuple
from datetime import datetime

from app.db.redis import get_client
from app.core.config import settings


class SearchHistoryService:
    """搜索历史服务类"""
    
    # Redis键前缀
    USER_HISTORY_PREFIX = "search:history:user"
    GLOBAL_HOT_KEY = "search:hot:global"
    SUGGESTION_PREFIX = "search:suggest"
    
    # 配置
    MAX_HISTORY_SIZE = 20  # 每个用户保存的最大搜索历史数
    HOT_KEYWORD_LIMIT = 50  # 热词排行榜最多保存的数量
    
    @staticmethod
    async def record_search(user_id: str, keyword: str, category: Optional[str] = None) -> bool:
        """记录用户搜索
        
        Args:
            user_id: 用户ID
            keyword: 搜索关键词
            category: 搜索分类（papers, projects, patents等）
            
        Returns:
            是否记录成功
        """
        if not settings.redis_enabled or not keyword.strip():
            return False
        
        keyword = keyword.strip()
        
        try:
            client = get_client()
            
            # 1. 记录到用户搜索历史（List结构，保持时间顺序）
            user_key = f"{SearchHistoryService.USER_HISTORY_PREFIX}:{user_id}"
            
            # 添加到列表头部
            await client.lpush(user_key, keyword)
            
            # 裁剪列表，只保留最近N条
            await client.ltrim(user_key, 0, SearchHistoryService.MAX_HISTORY_SIZE - 1)
            
            # 设置过期时间（30天）
            await client.expire(user_key, 30 * 24 * 3600)
            
            # 2. 更新全局热词统计（Sorted Set结构，按搜索次数排序）
            await client.zincrby(
                SearchHistoryService.GLOBAL_HOT_KEY,
                1,  # 增加1次
                keyword
            )
            
            # 只保留前N个热词
            await client.zremrangebyrank(
                SearchHistoryService.GLOBAL_HOT_KEY,
                0,
                -(SearchHistoryService.HOT_KEYWORD_LIMIT + 1)
            )
            
            # 3. 如果指定了分类，也记录分类热词
            if category:
                category_key = f"{SearchHistoryService.GLOBAL_HOT_KEY}:{category}"
                await client.zincrby(category_key, 1, keyword)
                await client.zremrangebyrank(category_key, 0, -31)  # 保留前30
            
            return True
            
        except Exception as e:
            print(f"记录搜索历史失败: {e}")
            return False
    
    @staticmethod
    async def get_user_history(user_id: str, limit: int = 10) -> List[str]:
        """获取用户搜索历史
        
        Args:
            user_id: 用户ID
            limit: 返回数量限制
            
        Returns:
            搜索历史列表（按时间倒序）
        """
        if not settings.redis_enabled:
            return []
        
        try:
            client = get_client()
            user_key = f"{SearchHistoryService.USER_HISTORY_PREFIX}:{user_id}"
            
            # 获取最近的N条记录
            history = await client.lrange(user_key, 0, limit - 1)
            
            # 去重但保持顺序
            seen = set()
            unique_history = []
            for item in history:
                if item not in seen:
                    seen.add(item)
                    unique_history.append(item)
            
            return unique_history
            
        except Exception as e:
            print(f"获取搜索历史失败: {e}")
            return []
    
    @staticmethod
    async def get_hot_keywords(limit: int = 10, category: Optional[str] = None) -> List[Tuple[str, int]]:
        """获取热门搜索关键词
        
        Args:
            limit: 返回数量限制
            category: 分类（可选）
            
        Returns:
            [(关键词, 搜索次数), ...] 按搜索次数降序
        """
        if not settings.redis_enabled:
            return []
        
        try:
            client = get_client()
            
            # 选择键
            if category:
                key = f"{SearchHistoryService.GLOBAL_HOT_KEY}:{category}"
            else:
                key = SearchHistoryService.GLOBAL_HOT_KEY
            
            # 获取排名前N的关键词（降序）
            results = await client.zrevrange(key, 0, limit - 1, withscores=True)
            
            # 转换为 [(keyword, count), ...]
            hot_keywords = [(item[0], int(item[1])) for item in results]
            
            return hot_keywords
            
        except Exception as e:
            print(f"获取热词失败: {e}")
            return []
    
    @staticmethod
    async def get_search_suggestions(prefix: str, limit: int = 10) -> List[str]:
        """根据前缀获取搜索建议
        
        Args:
            prefix: 搜索前缀
            limit: 返回数量限制
            
        Returns:
            建议关键词列表
        """
        if not settings.redis_enabled or not prefix.strip():
            return []
        
        prefix = prefix.strip().lower()
        
        try:
            client = get_client()
            
            # 从全局热词中筛选匹配的关键词
            all_hot = await client.zrevrange(
                SearchHistoryService.GLOBAL_HOT_KEY,
                0,
                -1
            )
            
            # 筛选以prefix开头的关键词
            suggestions = [
                kw for kw in all_hot
                if kw.lower().startswith(prefix)
            ]
            
            return suggestions[:limit]
            
        except Exception as e:
            print(f"获取搜索建议失败: {e}")
            return []
    
    @staticmethod
    async def clear_user_history(user_id: str) -> bool:
        """清除用户搜索历史
        
        Args:
            user_id: 用户ID
            
        Returns:
            是否清除成功
        """
        if not settings.redis_enabled:
            return False
        
        try:
            client = get_client()
            user_key = f"{SearchHistoryService.USER_HISTORY_PREFIX}:{user_id}"
            await client.delete(user_key)
            return True
            
        except Exception as e:
            print(f"清除搜索历史失败: {e}")
            return False
    
    @staticmethod
    async def get_trending_searches(hours: int = 24, limit: int = 10) -> List[Tuple[str, int]]:
        """获取最近N小时的热门搜索（趋势）
        
        注意：这需要额外的时间序列数据，当前简化实现返回全局热词
        
        Args:
            hours: 最近多少小时
            limit: 返回数量限制
            
        Returns:
            [(关键词, 搜索次数), ...]
        """
        # 简化实现：返回全局热词
        return await SearchHistoryService.get_hot_keywords(limit)


# 创建全局实例
search_history_service = SearchHistoryService()

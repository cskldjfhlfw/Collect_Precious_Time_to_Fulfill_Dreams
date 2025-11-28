"""API限流服务"""
from typing import Optional, Tuple
from datetime import datetime

from app.db.redis import get_client
from app.core.config import settings


class RateLimiter:
    """API限流器类"""
    
    # Redis键前缀
    RATE_LIMIT_PREFIX = "ratelimit"
    
    # 默认限流规则（请求数/时间窗口秒数）
    DEFAULT_LIMITS = {
        "global": (1000, 60),      # 全局: 1000次/分钟
        "per_user": (100, 60),     # 单用户: 100次/分钟
        "per_ip": (200, 60),       # 单IP: 200次/分钟
        "auth": (10, 60),          # 认证接口: 10次/分钟
        "search": (30, 60),        # 搜索接口: 30次/分钟
    }
    
    @staticmethod
    async def check_rate_limit(
        identifier: str,
        limit_type: str = "per_user",
        max_requests: Optional[int] = None,
        window_seconds: Optional[int] = None
    ) -> Tuple[bool, int, int]:
        """检查是否超过限流
        
        Args:
            identifier: 标识符（用户ID、IP等）
            limit_type: 限流类型（global/per_user/per_ip/auth/search）
            max_requests: 最大请求数（可选，默认使用预设值）
            window_seconds: 时间窗口秒数（可选，默认使用预设值）
            
        Returns:
            (是否允许, 剩余请求数, 重置时间秒数)
        """
        if not settings.redis_enabled:
            # Redis未启用，不限流
            return (True, 999, 0)
        
        # 获取限流规则
        if max_requests is None or window_seconds is None:
            default_limit = RateLimiter.DEFAULT_LIMITS.get(
                limit_type,
                RateLimiter.DEFAULT_LIMITS["per_user"]
            )
            max_requests = max_requests or default_limit[0]
            window_seconds = window_seconds or default_limit[1]
        
        try:
            client = get_client()
            
            # 生成Redis键
            key = f"{RateLimiter.RATE_LIMIT_PREFIX}:{limit_type}:{identifier}"
            
            # 获取当前计数
            current_count = await client.get(key)
            
            if current_count is None:
                # 第一次请求，设置计数为1
                await client.setex(key, window_seconds, "1")
                return (True, max_requests - 1, window_seconds)
            
            current_count = int(current_count)
            
            if current_count >= max_requests:
                # 超过限制
                ttl = await client.ttl(key)
                return (False, 0, ttl if ttl > 0 else window_seconds)
            
            # 增加计数
            await client.incr(key)
            remaining = max_requests - current_count - 1
            ttl = await client.ttl(key)
            
            return (True, remaining, ttl if ttl > 0 else window_seconds)
            
        except Exception as e:
            print(f"限流检查失败: {e}")
            # 出错时不限流，保证服务可用
            return (True, 999, 0)
    
    @staticmethod
    async def reset_rate_limit(identifier: str, limit_type: str = "per_user") -> bool:
        """重置限流计数器
        
        Args:
            identifier: 标识符
            limit_type: 限流类型
            
        Returns:
            是否重置成功
        """
        if not settings.redis_enabled:
            return False
        
        try:
            client = get_client()
            key = f"{RateLimiter.RATE_LIMIT_PREFIX}:{limit_type}:{identifier}"
            await client.delete(key)
            return True
        except Exception as e:
            print(f"重置限流失败: {e}")
            return False
    
    @staticmethod
    async def get_rate_limit_info(
        identifier: str,
        limit_type: str = "per_user"
    ) -> dict:
        """获取限流信息
        
        Args:
            identifier: 标识符
            limit_type: 限流类型
            
        Returns:
            限流信息字典
        """
        if not settings.redis_enabled:
            return {
                "enabled": False,
                "current": 0,
                "limit": 0,
                "remaining": 999,
                "reset_in": 0
            }
        
        try:
            client = get_client()
            key = f"{RateLimiter.RATE_LIMIT_PREFIX}:{limit_type}:{identifier}"
            
            current_count = await client.get(key)
            ttl = await client.ttl(key)
            
            # 获取限制值
            default_limit = RateLimiter.DEFAULT_LIMITS.get(
                limit_type,
                RateLimiter.DEFAULT_LIMITS["per_user"]
            )
            max_requests = default_limit[0]
            
            if current_count is None:
                return {
                    "enabled": True,
                    "current": 0,
                    "limit": max_requests,
                    "remaining": max_requests,
                    "reset_in": 0
                }
            
            current = int(current_count)
            remaining = max(0, max_requests - current)
            
            return {
                "enabled": True,
                "current": current,
                "limit": max_requests,
                "remaining": remaining,
                "reset_in": ttl if ttl > 0 else 0
            }
            
        except Exception as e:
            print(f"获取限流信息失败: {e}")
            return {
                "enabled": False,
                "current": 0,
                "limit": 0,
                "remaining": 999,
                "reset_in": 0,
                "error": str(e)
            }
    
    @staticmethod
    async def get_all_rate_limits() -> dict:
        """获取所有限流键的统计信息（管理员功能）
        
        Returns:
            限流统计信息
        """
        if not settings.redis_enabled:
            return {"enabled": False, "total_keys": 0}
        
        try:
            client = get_client()
            pattern = f"{RateLimiter.RATE_LIMIT_PREFIX}:*"
            keys = await client.keys(pattern)
            
            stats = {
                "enabled": True,
                "total_keys": len(keys),
                "by_type": {}
            }
            
            # 按类型分组统计
            for key in keys:
                parts = key.split(":")
                if len(parts) >= 2:
                    limit_type = parts[1]
                    stats["by_type"][limit_type] = stats["by_type"].get(limit_type, 0) + 1
            
            return stats
            
        except Exception as e:
            print(f"获取限流统计失败: {e}")
            return {"enabled": False, "total_keys": 0, "error": str(e)}


# 创建全局实例
rate_limiter = RateLimiter()

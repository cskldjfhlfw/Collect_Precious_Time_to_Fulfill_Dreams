"""Token黑名单服务"""
from typing import Optional
from datetime import datetime, timedelta
import jwt
import hashlib
import json
import os

from app.db.redis import get_client
from app.core.config import settings


class TokenBlacklistService:
    """Token黑名单服务类"""
    
    # Redis键前缀
    BLACKLIST_PREFIX = "token:blacklist"
    
    # JWT配置 - 从环境变量读取
    JWT_SECRET_KEY = os.getenv("APP_JWT_SECRET_KEY", "")
    JWT_ALGORITHM = "HS256"
    
    # 默认TTL（24小时），当无法解析token时使用
    DEFAULT_TTL = 24 * 3600
    
    @staticmethod
    async def add_to_blacklist(token: str, reason: str = "logout") -> bool:
        """将Token添加到黑名单
        
        Args:
            token: JWT token字符串
            reason: 加入黑名单的原因（logout/revoke/expired等）
            
        Returns:
            是否添加成功
        """
        if not settings.redis_enabled or not token:
            return False
        
        try:
            # 使用token哈希作为键（更安全，不需要解析token）
            token_hash = hashlib.sha256(token.encode()).hexdigest()
            key = f"{TokenBlacklistService.BLACKLIST_PREFIX}:{token_hash}"
            
            # 尝试解析token获取过期时间（如果失败则使用默认TTL）
            try:
                if TokenBlacklistService.JWT_SECRET_KEY:
                    # 使用验证签名的方式解析token
                    payload = jwt.decode(
                        token,
                        TokenBlacklistService.JWT_SECRET_KEY,
                        algorithms=[TokenBlacklistService.JWT_ALGORITHM]
                    )
                    exp = payload.get("exp")
                    
                    if exp:
                        # 计算剩余有效期
                        exp_datetime = datetime.fromtimestamp(exp)
                        now = datetime.now()
                        ttl = max(int((exp_datetime - now).total_seconds()), 60)
                    else:
                        ttl = TokenBlacklistService.DEFAULT_TTL
                else:
                    # 如果没有配置密钥，使用默认TTL
                    ttl = TokenBlacklistService.DEFAULT_TTL
            except Exception as e:
                # 如果解析失败，使用默认TTL
                print(f"无法解析token: {e}，使用默认TTL")
                ttl = TokenBlacklistService.DEFAULT_TTL
            
            client = get_client()
            
            # 存储到Redis，值为加入黑名单的信息
            blacklist_info = {
                "reason": reason,
                "blacklisted_at": datetime.now().isoformat()
            }
            
            await client.setex(
                key,
                ttl,
                json.dumps(blacklist_info)
            )
            
            print(f"✅ Token已加入黑名单: {key[:50]}... (TTL: {ttl}秒)")
            return True
            
        except Exception as e:
            print(f"添加token到黑名单失败: {e}")
            return False
    
    @staticmethod
    async def is_blacklisted(token: str) -> bool:
        """检查Token是否在黑名单中
        
        Args:
            token: JWT token字符串
            
        Returns:
            是否在黑名单中
        """
        if not settings.redis_enabled or not token:
            return False
        
        try:
            # 使用token哈希作为键
            token_hash = hashlib.sha256(token.encode()).hexdigest()
            key = f"{TokenBlacklistService.BLACKLIST_PREFIX}:{token_hash}"
            
            client = get_client()
            exists = await client.exists(key)
            
            return exists > 0
            
        except Exception as e:
            print(f"检查token黑名单失败: {e}")
            return False
    
    @staticmethod
    async def remove_from_blacklist(token: str) -> bool:
        """从黑名单中移除Token（管理员操作）
        
        Args:
            token: JWT token字符串
            
        Returns:
            是否移除成功
        """
        if not settings.redis_enabled or not token:
            return False
        
        try:
            # 使用token哈希作为键
            token_hash = hashlib.sha256(token.encode()).hexdigest()
            key = f"{TokenBlacklistService.BLACKLIST_PREFIX}:{token_hash}"
            
            client = get_client()
            deleted = await client.delete(key)
            
            return deleted > 0
            
        except Exception as e:
            print(f"从黑名单移除token失败: {e}")
            return False
    
    @staticmethod
    async def get_blacklist_count() -> int:
        """获取黑名单中的Token数量
        
        Returns:
            黑名单Token数量
        """
        if not settings.redis_enabled:
            return 0
        
        try:
            client = get_client()
            pattern = f"{TokenBlacklistService.BLACKLIST_PREFIX}:*"
            keys = await client.keys(pattern)
            return len(keys)
            
        except Exception as e:
            print(f"获取黑名单数量失败: {e}")
            return 0
    
    @staticmethod
    async def clear_expired_tokens() -> int:
        """清理已过期的Token（Redis会自动清理，此方法用于手动触发）
        
        Returns:
            清理的Token数量
        """
        # Redis的SETEX会自动清理过期键，这里只是占位方法
        # 实际上不需要手动清理
        return 0


# 创建全局实例
token_blacklist_service = TokenBlacklistService()

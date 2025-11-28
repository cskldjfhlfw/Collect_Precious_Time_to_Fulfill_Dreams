"""
验证码管理服务
使用Redis存储验证码，提供持久化和分布式支持
"""
import secrets
import string
import json
from datetime import datetime, timedelta
from typing import Optional

from app.db.redis import get_client
from app.core.config import settings

# 验证码配置
CODE_LENGTH = 6  # 验证码长度
CODE_EXPIRY_MINUTES = 5  # 验证码有效期（分钟）
MAX_ATTEMPTS = 3  # 最大尝试次数
RESEND_INTERVAL_SECONDS = 60  # 重发间隔（秒）

# Redis键前缀
VERIFICATION_CODE_PREFIX = "verification:code"


def generate_code() -> str:
    """生成6位数字验证码"""
    return ''.join(secrets.choice(string.digits) for _ in range(CODE_LENGTH))


async def create_verification_code(email: str) -> tuple[str, bool]:
    """
    创建验证码
    
    Args:
        email: 邮箱地址
    
    Returns:
        (验证码, 是否创建成功)
        如果最近刚发送过，返回 ("", False)
    """
    # 如果Redis未启用，使用临时方案
    if not settings.redis_enabled:
        code = generate_code()
        print(f"⚠️ Redis未启用，验证码: {code}")
        return code, True
    
    try:
        client = get_client()
        key = f"{VERIFICATION_CODE_PREFIX}:{email}"
        
        # 检查是否最近刚发送过
        existing_data = await client.get(key)
        if existing_data:
            existing = json.loads(existing_data)
            created_at = datetime.fromisoformat(existing["created_at"])
            time_since_created = datetime.now() - created_at
            
            if time_since_created.total_seconds() < RESEND_INTERVAL_SECONDS:
                remaining = RESEND_INTERVAL_SECONDS - int(time_since_created.total_seconds())
                print(f"⚠️ 发送过于频繁，需等待 {remaining} 秒")
                return "", False
        
        # 生成新验证码
        code = generate_code()
        code_data = {
            "code": code,
            "expires_at": (datetime.now() + timedelta(minutes=CODE_EXPIRY_MINUTES)).isoformat(),
            "attempts": 0,
            "created_at": datetime.now().isoformat()
        }
        
        # 存储到Redis，设置过期时间
        await client.setex(
            key,
            CODE_EXPIRY_MINUTES * 60,
            json.dumps(code_data)
        )
        
        print(f"✅ 验证码已生成并存储到Redis: {email}")
        return code, True
        
    except Exception as e:
        print(f"❌ 创建验证码失败: {e}")
        # 出错时返回临时验证码
        code = generate_code()
        return code, True


async def verify_code(email: str, code: str) -> tuple[bool, str]:
    """
    验证验证码
    
    Args:
        email: 邮箱地址
        code: 验证码
    
    Returns:
        (是否验证成功, 错误信息)
    """
    # 如果Redis未启用，直接通过
    if not settings.redis_enabled:
        print(f"⚠️ Redis未启用，验证码验证跳过")
        return True, ""
    
    try:
        client = get_client()
        key = f"{VERIFICATION_CODE_PREFIX}:{email}"
        
        # 获取存储的验证码
        stored_data = await client.get(key)
        if not stored_data:
            return False, "验证码不存在或已过期"
        
        stored = json.loads(stored_data)
        
        # 检查是否过期
        expires_at = datetime.fromisoformat(stored["expires_at"])
        if datetime.now() > expires_at:
            await client.delete(key)
            return False, "验证码已过期"
        
        # 检查尝试次数
        if stored["attempts"] >= MAX_ATTEMPTS:
            await client.delete(key)
            return False, "验证码尝试次数过多，请重新获取"
        
        # 验证码错误
        if stored["code"] != code:
            stored["attempts"] += 1
            # 更新尝试次数
            await client.setex(
                key,
                CODE_EXPIRY_MINUTES * 60,
                json.dumps(stored)
            )
            return False, f"验证码错误，还可尝试 {MAX_ATTEMPTS - stored['attempts']} 次"
        
        # 验证成功，删除验证码
        await client.delete(key)
        print(f"✅ 验证码验证成功: {email}")
        return True, ""
        
    except Exception as e:
        print(f"❌ 验证验证码失败: {e}")
        # 出错时拒绝验证
        return False, "验证失败，请重试"


async def cleanup_expired_codes():
    """清理过期的验证码（Redis自动过期，此函数仅保留兼容性）"""
    # Redis会自动清理过期的键，无需手动清理
    print("ℹ️ Redis自动管理过期键，无需手动清理")
    pass


async def get_remaining_time(email: str) -> Optional[int]:
    """
    获取验证码剩余有效时间（秒）
    
    Returns:
        剩余秒数，如果不存在或已过期返回None
    """
    if not settings.redis_enabled:
        return None
    
    try:
        client = get_client()
        key = f"{VERIFICATION_CODE_PREFIX}:{email}"
        
        # 获取TTL
        ttl = await client.ttl(key)
        
        return ttl if ttl > 0 else None
        
    except Exception as e:
        print(f"❌ 获取剩余时间失败: {e}")
        return None

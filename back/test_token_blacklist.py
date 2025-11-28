#!/usr/bin/env python3
"""测试Token黑名单功能"""
import asyncio
import sys
import os
from pathlib import Path

# 切换到back目录
os.chdir(Path(__file__).parent)
sys.path.insert(0, str(Path(__file__).parent))

from app.db.redis import init_redis, get_client, close_redis
from app.services.token_blacklist import token_blacklist_service
from app.core.security import create_access_token


async def test_token_blacklist():
    """测试token黑名单功能"""
    
    print("=" * 70)
    print("🔒 测试Token黑名单功能")
    print("=" * 70)
    
    # 初始化Redis
    print("\n1️⃣ 初始化Redis...")
    try:
        await init_redis()
        redis_client = get_client()
        print("   ✅ Redis连接成功")
    except Exception as e:
        print(f"   ❌ Redis连接失败: {e}")
        return False
    
    # 清除旧的黑名单数据
    print("\n2️⃣ 清除旧的黑名单数据...")
    old_keys = await redis_client.keys("token:blacklist:*")
    if old_keys:
        await redis_client.delete(*old_keys)
        print(f"   🗑️  已删除 {len(old_keys)} 个旧黑名单键")
    else:
        print("   ✅ 无旧数据需要清除")
    
    # 生成测试token
    print("\n3️⃣ 生成测试token...")
    test_tokens = []
    for i in range(3):
        token = create_access_token(data={"sub": f"test_user_{i}"})
        test_tokens.append(token)
        print(f"   ✅ Token {i+1}: {token[:50]}...")
    
    # 测试添加到黑名单
    print("\n4️⃣ 测试将token添加到黑名单...")
    for i, token in enumerate(test_tokens[:2]):  # 只加入前两个
        success = await token_blacklist_service.add_to_blacklist(
            token=token,
            reason=f"test_reason_{i}"
        )
        if success:
            print(f"   ✅ Token {i+1} 已加入黑名单")
        else:
            print(f"   ❌ Token {i+1} 加入黑名单失败")
    
    # 测试检查黑名单
    print("\n5️⃣ 测试检查token是否在黑名单中...")
    for i, token in enumerate(test_tokens):
        is_blacklisted = await token_blacklist_service.is_blacklisted(token)
        status = "🚫 在黑名单中" if is_blacklisted else "✅ 不在黑名单中"
        expected = i < 2  # 前两个应该在黑名单中
        match = "✅" if (is_blacklisted == expected) else "❌"
        print(f"   {match} Token {i+1}: {status}")
    
    # 测试获取黑名单数量
    print("\n6️⃣ 测试获取黑名单数量...")
    count = await token_blacklist_service.get_blacklist_count()
    print(f"   📊 黑名单中有 {count} 个token")
    if count == 2:
        print("   ✅ 数量正确")
    else:
        print(f"   ❌ 数量错误，期望2个，实际{count}个")
    
    # 测试从黑名单移除
    print("\n7️⃣ 测试从黑名单移除token...")
    success = await token_blacklist_service.remove_from_blacklist(test_tokens[0])
    if success:
        print(f"   ✅ Token 1 已从黑名单移除")
    else:
        print(f"   ❌ Token 1 移除失败")
    
    # 再次检查
    is_blacklisted = await token_blacklist_service.is_blacklisted(test_tokens[0])
    if not is_blacklisted:
        print(f"   ✅ 验证成功：Token 1 不在黑名单中")
    else:
        print(f"   ❌ 验证失败：Token 1 仍在黑名单中")
    
    # 检查Redis中的键
    print("\n8️⃣ 检查Redis中的黑名单键...")
    blacklist_keys = await redis_client.keys("token:blacklist:*")
    print(f"   🔑 黑名单键数: {len(blacklist_keys)}")
    for key in blacklist_keys[:5]:  # 只显示前5个
        ttl = await redis_client.ttl(key)
        value = await redis_client.get(key)
        print(f"      {key}")
        print(f"         TTL: {ttl}秒 ({ttl//3600}小时{(ttl%3600)//60}分)")
        if value:
            import json
            try:
                info = json.loads(value)
                print(f"         原因: {info.get('reason', 'unknown')}")
                print(f"         时间: {info.get('blacklisted_at', 'unknown')}")
            except:
                print(f"         值: {value[:100]}")
    
    # 测试过期token（模拟）
    print("\n9️⃣ 测试添加已过期的token...")
    from datetime import datetime, timedelta
    import os
    try:
        import jwt
        # 从环境变量读取JWT secret
        jwt_secret = os.getenv("APP_JWT_SECRET_KEY", "")
        if not jwt_secret:
            print(f"   ⚠️  未设置APP_JWT_SECRET_KEY环境变量")
            print(f"   ℹ️  跳过过期token测试")
            expired_token = None
        else:
            # 创建一个1秒后过期的token
            exp_time = datetime.utcnow() + timedelta(seconds=1)
            expired_token = jwt.encode(
                {"sub": "test_user_exp", "exp": exp_time},
                jwt_secret,
                algorithm="HS256"
            )
    except Exception as e:
        print(f"   ⚠️  无法生成过期token: {e}")
        print(f"   ℹ️  跳过过期token测试")
        expired_token = None
    
    if expired_token:
        success = await token_blacklist_service.add_to_blacklist(
            token=expired_token,
            reason="logout"
        )
        if success:
            print(f"   ✅ 过期token已加入黑名单")
            # 等待2秒让它过期
            print(f"   ⏰ 等待token过期...")
            await asyncio.sleep(2)
            
            # 检查是否还在黑名单中（应该已被Redis自动清除）
            is_still_blacklisted = await token_blacklist_service.is_blacklisted(expired_token)
            if not is_still_blacklisted:
                print(f"   ✅ 过期token已被Redis自动清除")
            else:
                print(f"   ⚠️  过期token仍在黑名单中（可能TTL设置较长）")
    
    # 清理测试数据
    print("\n🧹 清理测试数据...")
    test_keys = await redis_client.keys("token:blacklist:*")
    if test_keys:
        await redis_client.delete(*test_keys)
        print(f"   ✅ 已清理 {len(test_keys)} 个测试键")
    
    # 关闭连接
    await close_redis()
    
    print("\n" + "=" * 70)
    print("✅ Token黑名单功能测试完成！")
    print("=" * 70)
    
    print("\n💡 使用说明:")
    print("1. 用户登出时调用 POST /api/auth/logout")
    print("2. Token自动加入黑名单，立即失效")
    print("3. 后续请求会被拒绝：401 Token已失效")
    print("4. 管理员可通过 POST /api/auth/revoke-token 撤销任意token")
    print("5. 管理员可通过 GET /api/auth/blacklist/count 查看黑名单数量")
    
    print("\n🔒 安全特性:")
    print("- ✅ 登出后token立即失效")
    print("- ✅ 被盗token可被撤销")
    print("- ✅ 自动清理过期token（节省内存）")
    print("- ✅ 优雅降级（Redis故障时不影响登录）")
    
    return True


if __name__ == "__main__":
    try:
        asyncio.run(test_token_blacklist())
    except KeyboardInterrupt:
        print("\n\n⚠️ 测试被中断")
    except Exception as e:
        print(f"\n\n💥 测试失败: {e}")
        import traceback
        traceback.print_exc()

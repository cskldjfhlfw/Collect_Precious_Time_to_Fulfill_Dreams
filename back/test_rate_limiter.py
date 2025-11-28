#!/usr/bin/env python3
"""测试API限流功能"""
import asyncio
import sys
import os
from pathlib import Path

# 切换到back目录
os.chdir(Path(__file__).parent)
sys.path.insert(0, str(Path(__file__).parent))

from app.db.redis import init_redis, get_client, close_redis
from app.services.rate_limiter import rate_limiter


async def test_rate_limiter():
    """测试限流功能"""
    
    print("=" * 70)
    print("🚦 测试API限流功能")
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
    
    # 清除旧的限流数据
    print("\n2️⃣ 清除旧的限流数据...")
    old_keys = await redis_client.keys("ratelimit:*")
    if old_keys:
        await redis_client.delete(*old_keys)
        print(f"   🗑️  已删除 {len(old_keys)} 个旧限流键")
    else:
        print("   ✅ 无旧数据需要清除")
    
    # 测试标识符
    test_user_id = "test_user_123"
    test_ip = "192.168.1.100"
    
    # 测试单次请求
    print("\n3️⃣ 测试单次请求限流检查...")
    allowed, remaining, reset_in = await rate_limiter.check_rate_limit(
        identifier=test_user_id,
        limit_type="per_user",
        max_requests=5,  # 设置为5次方便测试
        window_seconds=60
    )
    print(f"   ✅ 第1次请求: 允许={allowed}, 剩余={remaining}, 重置={reset_in}秒")
    
    # 测试连续请求
    print("\n4️⃣ 测试连续请求（限制5次）...")
    for i in range(2, 8):
        allowed, remaining, reset_in = await rate_limiter.check_rate_limit(
            identifier=test_user_id,
            limit_type="per_user",
            max_requests=5,
            window_seconds=60
        )
        status = "✅ 允许" if allowed else "🚫 拒绝"
        print(f"   {status} 第{i}次请求: 允许={allowed}, 剩余={remaining}, 重置={reset_in}秒")
        
        if not allowed and i == 6:
            print(f"   ℹ️  达到限制，需要等待 {reset_in} 秒")
    
    # 测试不同的限流类型
    print("\n5️⃣ 测试不同限流类型...")
    
    # IP限流
    ip_allowed, ip_remaining, ip_reset = await rate_limiter.check_rate_limit(
        identifier=test_ip,
        limit_type="per_ip",
        max_requests=200,
        window_seconds=60
    )
    print(f"   🌐 IP限流: 允许={ip_allowed}, 剩余={ip_remaining}")
    
    # 认证接口限流（更严格）
    auth_allowed, auth_remaining, auth_reset = await rate_limiter.check_rate_limit(
        identifier=test_ip,
        limit_type="auth",
        max_requests=10,
        window_seconds=60
    )
    print(f"   🔐 认证限流: 允许={auth_allowed}, 剩余={auth_remaining}")
    
    # 搜索接口限流
    search_allowed, search_remaining, search_reset = await rate_limiter.check_rate_limit(
        identifier=test_user_id,
        limit_type="search",
        max_requests=30,
        window_seconds=60
    )
    print(f"   🔍 搜索限流: 允许={search_allowed}, 剩余={search_remaining}")
    
    # 测试获取限流信息
    print("\n6️⃣ 测试获取限流信息...")
    info = await rate_limiter.get_rate_limit_info(
        identifier=test_user_id,
        limit_type="per_user"
    )
    print(f"   📊 用户限流信息:")
    print(f"      启用: {info.get('enabled')}")
    print(f"      当前: {info.get('current')}/{info.get('limit')}")
    print(f"      剩余: {info.get('remaining')}")
    print(f"      重置: {info.get('reset_in')}秒")
    
    # 测试重置限流
    print("\n7️⃣ 测试重置限流...")
    success = await rate_limiter.reset_rate_limit(
        identifier=test_user_id,
        limit_type="per_user"
    )
    print(f"   {'✅ 重置成功' if success else '❌ 重置失败'}")
    
    # 验证重置
    after_reset_allowed, after_reset_remaining, _ = await rate_limiter.check_rate_limit(
        identifier=test_user_id,
        limit_type="per_user",
        max_requests=5,
        window_seconds=60
    )
    print(f"   ✅ 重置后请求: 允许={after_reset_allowed}, 剩余={after_reset_remaining}")
    
    # 测试全局统计
    print("\n8️⃣ 测试获取全局限流统计...")
    stats = await rate_limiter.get_all_rate_limits()
    print(f"   📊 限流统计:")
    print(f"      启用: {stats.get('enabled')}")
    print(f"      总键数: {stats.get('total_keys')}")
    if stats.get('by_type'):
        print(f"      按类型:")
        for limit_type, count in stats['by_type'].items():
            print(f"         {limit_type}: {count} 个")
    
    # 检查Redis中的键
    print("\n9️⃣ 检查Redis中的限流键...")
    rate_keys = await redis_client.keys("ratelimit:*")
    print(f"   🔑 限流键数: {len(rate_keys)}")
    for key in rate_keys[:5]:  # 只显示前5个
        ttl = await redis_client.ttl(key)
        value = await redis_client.get(key)
        print(f"      {key}")
        print(f"         计数: {value}, TTL: {ttl}秒")
    
    # 测试并发请求（模拟）
    print("\n🔟 测试并发请求...")
    test_concurrent_user = "concurrent_user_456"
    results = []
    
    # 模拟10个并发请求
    for i in range(10):
        allowed, remaining, _ = await rate_limiter.check_rate_limit(
            identifier=test_concurrent_user,
            limit_type="per_user",
            max_requests=5,
            window_seconds=60
        )
        results.append((i+1, allowed, remaining))
    
    print(f"   📊 并发请求结果:")
    allowed_count = sum(1 for _, allowed, _ in results if allowed)
    rejected_count = len(results) - allowed_count
    print(f"      允许: {allowed_count} 次")
    print(f"      拒绝: {rejected_count} 次")
    
    # 清理测试数据
    print("\n🧹 清理测试数据...")
    test_keys = await redis_client.keys("ratelimit:*")
    if test_keys:
        await redis_client.delete(*test_keys)
        print(f"   ✅ 已清理 {len(test_keys)} 个测试键")
    
    # 关闭连接
    await close_redis()
    
    print("\n" + "=" * 70)
    print("✅ API限流功能测试完成！")
    print("=" * 70)
    
    print("\n💡 使用说明:")
    print("1. 限流自动应用于所有API请求")
    print("2. 超限时返回 429 Too Many Requests")
    print("3. 响应头包含限流信息:")
    print("   - X-RateLimit-Limit: 限制数量")
    print("   - X-RateLimit-Remaining: 剩余次数")
    print("   - X-RateLimit-Reset: 重置时间（秒）")
    print("4. 管理员可通过 /api/rate-limit/reset 重置限流")
    
    print("\n📋 默认限流规则:")
    print("- 全局: 1000次/分钟")
    print("- 单用户: 100次/分钟")
    print("- 单IP: 200次/分钟")
    print("- 认证接口: 10次/分钟")
    print("- 搜索接口: 30次/分钟")
    
    return True


if __name__ == "__main__":
    try:
        asyncio.run(test_rate_limiter())
    except KeyboardInterrupt:
        print("\n\n⚠️ 测试被中断")
    except Exception as e:
        print(f"\n\n💥 测试失败: {e}")
        import traceback
        traceback.print_exc()

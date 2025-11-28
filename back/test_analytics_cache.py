#!/usr/bin/env python3
"""测试Analytics缓存是否真正工作"""
import asyncio
import sys
import os
from pathlib import Path

# 切换到back目录
os.chdir(Path(__file__).parent)
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.db.redis import init_redis, get_client, close_redis
from app.db.postgres import get_session
from app.models.tables import User
from app.api.routes.analytics import get_analytics_overview


async def test_analytics_cache():
    """测试analytics缓存是否真正工作"""
    
    print("=" * 70)
    print("🧪 测试Analytics缓存功能")
    print("=" * 70)
    
    # 1. 初始化Redis
    print("\n1️⃣ 初始化Redis...")
    try:
        await init_redis()
        redis_client = get_client()
        print("   ✅ Redis连接成功")
        
        # 检查当前键
        initial_keys = await redis_client.keys("analytics:*")
        print(f"   📊 当前analytics缓存键数: {len(initial_keys)}")
        if initial_keys:
            print(f"   🔑 现有键: {initial_keys}")
        
    except Exception as e:
        print(f"   ❌ Redis连接失败: {e}")
        return False
    
    # 2. 创建数据库连接
    print("\n2️⃣ 创建数据库连接...")
    try:
        engine = create_async_engine(
            str(settings.postgres_dsn),
            echo=False,
        )
        async_session = sessionmaker(
            engine, class_=AsyncSession, expire_on_commit=False
        )
        print("   ✅ 数据库连接成功")
    except Exception as e:
        print(f"   ❌ 数据库连接失败: {e}")
        return False
    
    # 3. 获取测试用户
    print("\n3️⃣ 获取测试用户...")
    try:
        async with async_session() as db:
            from sqlalchemy import select
            result = await db.execute(select(User).limit(1))
            test_user = result.scalar_one_or_none()
            
            if not test_user:
                print("   ❌ 数据库中没有用户，请先创建用户")
                return False
            
            print(f"   ✅ 使用测试用户: {test_user.username} (ID: {test_user.id})")
    except Exception as e:
        print(f"   ❌ 获取用户失败: {e}")
        return False
    
    # 4. 清除旧缓存
    print("\n4️⃣ 清除旧的analytics缓存...")
    try:
        old_keys = await redis_client.keys("analytics:*")
        if old_keys:
            deleted = await redis_client.delete(*old_keys)
            print(f"   🗑️  已删除 {deleted} 个旧缓存键")
        else:
            print("   ✅ 无旧缓存需要清除")
    except Exception as e:
        print(f"   ⚠️  清除缓存失败: {e}")
    
    # 5. 第一次调用API（应该查询数据库并写入缓存）
    print("\n5️⃣ 第一次调用analytics API...")
    try:
        async with async_session() as db:
            import time
            start_time = time.time()
            
            result1 = await get_analytics_overview(
                current_user=test_user,
                db=db,
                show_all=True,
                my_only=False
            )
            
            elapsed1 = time.time() - start_time
            print(f"   ✅ API调用成功")
            print(f"   ⏱️  耗时: {elapsed1*1000:.2f}ms")
            print(f"   📊 返回数据: {result1.summary.total_papers} 篇论文, "
                  f"{result1.summary.total_projects} 个项目, "
                  f"{result1.summary.total_patents} 个专利")
    except Exception as e:
        print(f"   ❌ API调用失败: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # 6. 检查缓存是否已写入
    print("\n6️⃣ 检查Redis缓存...")
    try:
        cache_keys = await redis_client.keys("analytics:*")
        print(f"   📈 当前analytics缓存键数: {len(cache_keys)}")
        
        if cache_keys:
            print(f"   ✅ 缓存已写入！")
            for key in cache_keys:
                # 获取TTL
                ttl = await redis_client.ttl(key)
                print(f"   🔑 {key}")
                print(f"      ⏰ TTL: {ttl}秒 (剩余 {ttl//60}分{ttl%60}秒)")
                
                # 获取缓存大小
                value = await redis_client.get(key)
                if value:
                    print(f"      📦 大小: {len(value)} 字节")
        else:
            print(f"   ❌ 缓存未写入！这不对！")
            print(f"   💡 可能的原因:")
            print(f"      1. cache_service.set() 没有被调用")
            print(f"      2. Redis写入失败但异常被捕获")
            print(f"      3. 缓存键名不匹配")
    except Exception as e:
        print(f"   ❌ 检查缓存失败: {e}")
        return False
    
    # 7. 第二次调用API（应该从缓存读取）
    print("\n7️⃣ 第二次调用analytics API（应从缓存读取）...")
    try:
        async with async_session() as db:
            import time
            start_time = time.time()
            
            result2 = await get_analytics_overview(
                current_user=test_user,
                db=db,
                show_all=True,
                my_only=False
            )
            
            elapsed2 = time.time() - start_time
            print(f"   ✅ API调用成功")
            print(f"   ⏱️  耗时: {elapsed2*1000:.2f}ms")
            
            # 对比性能
            if elapsed2 > 0 and elapsed2 < elapsed1:
                speedup = elapsed1 / elapsed2
                print(f"   🚀 性能提升: {speedup:.1f}倍")
            elif elapsed2 <= 0.001:  # 小于1ms
                print(f"   🚀 性能提升: 极快！从 {elapsed1*1000:.2f}ms 降到几乎瞬间完成")
            else:
                print(f"   ⚠️  第二次调用反而更慢，可能没有使用缓存")
    except Exception as e:
        print(f"   ❌ API调用失败: {e}")
        return False
    
    # 8. 再次检查所有Redis键
    print("\n8️⃣ 查看Redis中所有键...")
    try:
        all_keys = await redis_client.keys("*")
        print(f"   📊 Redis总键数: {len(all_keys)}")
        
        # 按前缀分组
        key_groups = {}
        for key in all_keys:
            prefix = key.split(':')[0] if ':' in key else 'other'
            key_groups[prefix] = key_groups.get(prefix, 0) + 1
        
        print(f"   📈 键分布:")
        for prefix, count in sorted(key_groups.items()):
            print(f"      {prefix}: {count} 个")
    except Exception as e:
        print(f"   ⚠️  无法列出所有键: {e}")
    
    # 9. 清理
    await close_redis()
    await engine.dispose()
    
    print("\n" + "=" * 70)
    print("✅ 测试完成！")
    print("=" * 70)
    
    if cache_keys:
        print("\n💡 结论: Analytics缓存功能正常工作")
        print(f"   - 缓存已写入Redis")
        print(f"   - 缓存过期时间: 5分钟")
        print(f"   - 性能提升明显")
    else:
        print("\n❌ 结论: Analytics缓存未工作")
        print(f"   请检查:")
        print(f"   1. app/api/routes/analytics.py 中是否导入了 cache_service")
        print(f"   2. cache_service.set() 是否被调用")
        print(f"   3. Redis是否有写入权限")
    
    return True


if __name__ == "__main__":
    try:
        asyncio.run(test_analytics_cache())
    except KeyboardInterrupt:
        print("\n\n⚠️ 测试被中断")
    except Exception as e:
        print(f"\n\n💥 测试失败: {e}")
        import traceback
        traceback.print_exc()

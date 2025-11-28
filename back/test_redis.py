#!/usr/bin/env python3
"""测试Redis连接和读写"""
import asyncio
import sys
import os
from pathlib import Path

# 切换到back目录，确保能正确加载.env
back_dir = Path(__file__).parent
os.chdir(back_dir)
sys.path.insert(0, str(back_dir))

# 在导入配置前，确保工作目录正确
from app.core.config import settings
from app.db.redis import init_redis, get_client, close_redis


async def test_redis():
    """测试Redis连接和基本操作"""
    
    print("=" * 60)
    print("🔴 Redis连接测试")
    print("=" * 60)
    
    # 调试信息
    print(f"\n🔍 调试信息:")
    print(f"   当前工作目录: {os.getcwd()}")
    env_file = Path(".env")
    print(f"   .env文件存在: {env_file.exists()}")
    if env_file.exists():
        print(f"   .env文件路径: {env_file.absolute()}")
    
    # 1. 检查配置
    print("\n1️⃣ 检查Redis配置:")
    print(f"   启用状态: {settings.redis_enabled}")
    print(f"   连接字符串: {settings.redis_dsn}")
    print(f"   SSL: {settings.redis_ssl}")
    
    if not settings.redis_enabled:
        print("\n❌ Redis未启用，请在.env中设置 APP_REDIS_ENABLED=true")
        return False
    
    # 2. 初始化连接
    print("\n2️⃣ 初始化Redis连接:")
    try:
        await init_redis()
        client = get_client()
        print("   ✅ Redis连接成功")
    except Exception as e:
        print(f"   ❌ Redis连接失败: {e}")
        print("\n💡 请确认:")
        print("   1. Redis服务是否已启动")
        print("   2. 端口6379是否可访问")
        print("   3. 连接字符串是否正确")
        return False
    
    # 3. 测试ping
    print("\n3️⃣ 测试PING:")
    try:
        pong = await client.ping()
        print(f"   ✅ PING -> {pong}")
    except Exception as e:
        print(f"   ❌ PING失败: {e}")
        return False
    
    # 4. 测试写入
    print("\n4️⃣ 测试写入数据:")
    try:
        test_key = "test:cache:hello"
        test_value = "world"
        await client.set(test_key, test_value, ex=60)
        print(f"   ✅ SET {test_key} = {test_value}")
    except Exception as e:
        print(f"   ❌ 写入失败: {e}")
        return False
    
    # 5. 测试读取
    print("\n5️⃣ 测试读取数据:")
    try:
        value = await client.get(test_key)
        print(f"   ✅ GET {test_key} = {value}")
        if value != test_value:
            print(f"   ⚠️ 值不匹配！期望: {test_value}, 实际: {value}")
    except Exception as e:
        print(f"   ❌ 读取失败: {e}")
        return False
    
    # 6. 测试JSON序列化
    print("\n6️⃣ 测试JSON序列化:")
    try:
        import json
        test_dict = {
            "name": "测试数据",
            "count": 123,
            "items": ["a", "b", "c"]
        }
        json_key = "test:cache:json"
        json_value = json.dumps(test_dict, ensure_ascii=False)
        await client.set(json_key, json_value, ex=60)
        print(f"   ✅ SET JSON: {json_key}")
        
        stored_value = await client.get(json_key)
        loaded_dict = json.loads(stored_value)
        print(f"   ✅ GET JSON: {loaded_dict}")
    except Exception as e:
        print(f"   ❌ JSON测试失败: {e}")
        return False
    
    # 7. 测试模式匹配删除
    print("\n7️⃣ 测试模式匹配删除:")
    try:
        # 创建测试键
        await client.set("test:pattern:1", "value1", ex=60)
        await client.set("test:pattern:2", "value2", ex=60)
        await client.set("test:pattern:3", "value3", ex=60)
        print("   ✅ 创建3个测试键")
        
        # 查找匹配的键
        keys = await client.keys("test:pattern:*")
        print(f"   ✅ 找到 {len(keys)} 个匹配键: {keys}")
        
        # 删除匹配的键
        if keys:
            deleted = await client.delete(*keys)
            print(f"   ✅ 删除 {deleted} 个键")
    except Exception as e:
        print(f"   ❌ 模式匹配测试失败: {e}")
        return False
    
    # 8. 测试缓存服务
    print("\n8️⃣ 测试缓存服务:")
    try:
        from app.services.cache import cache_service
        
        # 设置缓存
        test_data = {
            "message": "Hello from cache service",
            "timestamp": "2024-11-16",
            "count": 42
        }
        success = await cache_service.set("test:service:data", test_data, expire=60)
        print(f"   ✅ 缓存服务SET: {success}")
        
        # 获取缓存
        cached = await cache_service.get("test:service:data")
        print(f"   ✅ 缓存服务GET: {cached}")
        
        # 检查存在
        exists = await cache_service.exists("test:service:data")
        print(f"   ✅ 缓存服务EXISTS: {exists}")
        
        # 删除缓存
        deleted = await cache_service.delete("test:service:data")
        print(f"   ✅ 缓存服务DELETE: {deleted}")
        
        # 再次检查
        exists_after = await cache_service.exists("test:service:data")
        print(f"   ✅ 删除后EXISTS: {exists_after}")
        
    except Exception as e:
        print(f"   ❌ 缓存服务测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # 9. 查看数据库信息
    print("\n9️⃣ Redis数据库信息:")
    try:
        info = await client.info()
        print(f"   Redis版本: {info.get('redis_version', 'N/A')}")
        print(f"   键总数: {await client.dbsize()}")
        print(f"   内存使用: {info.get('used_memory_human', 'N/A')}")
        print(f"   连接数: {info.get('connected_clients', 'N/A')}")
    except Exception as e:
        print(f"   ⚠️ 无法获取详细信息: {e}")
    
    # 10. 清理测试数据
    print("\n🧹 清理测试数据:")
    try:
        test_keys = await client.keys("test:*")
        if test_keys:
            await client.delete(*test_keys)
            print(f"   ✅ 已清理 {len(test_keys)} 个测试键")
        else:
            print("   ✅ 无需清理")
    except Exception as e:
        print(f"   ⚠️ 清理失败: {e}")
    
    # 关闭连接
    await close_redis()
    
    print("\n" + "=" * 60)
    print("✅ Redis测试全部通过！")
    print("=" * 60)
    print("\n💡 下一步:")
    print("1. 重启后端服务: Ctrl+C 后重新运行 uvicorn")
    print("2. 刷新前端页面: 按 Ctrl+Shift+R")
    print("3. 访问 Analytics 页面查看缓存效果")
    print("4. 在浏览器Console查看缓存日志")
    print("\n")
    
    return True


if __name__ == "__main__":
    try:
        success = asyncio.run(test_redis())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️ 测试被中断")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n💥 测试失败: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

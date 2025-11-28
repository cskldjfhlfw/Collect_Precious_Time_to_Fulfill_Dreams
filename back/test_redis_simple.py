#!/usr/bin/env python3
"""简单的Redis测试 - 直接加载配置"""
import asyncio
import os
from pathlib import Path

# 切换到正确的目录
os.chdir(Path(__file__).parent)
print(f"工作目录: {os.getcwd()}")

# 直接使用python-dotenv加载.env
from dotenv import load_dotenv
load_dotenv()

# 检查环境变量
print("\n环境变量检查:")
print(f"APP_REDIS_ENABLED = {os.getenv('APP_REDIS_ENABLED')}")
print(f"APP_REDIS_DSN = {os.getenv('APP_REDIS_DSN')}")
print(f"APP_REDIS_SSL = {os.getenv('APP_REDIS_SSL')}")

# 测试Redis连接
try:
    import redis.asyncio as redis
    
    async def test():
        redis_dsn = os.getenv('APP_REDIS_DSN', 'redis://localhost:6379/0')
        print(f"\n尝试连接: {redis_dsn}")
        
        client = redis.from_url(
            redis_dsn,
            encoding="utf-8",
            decode_responses=True
        )
        
        # 测试ping
        pong = await client.ping()
        print(f"✅ PING -> {pong}")
        
        # 测试写入
        await client.set("test:simple", "hello", ex=60)
        print("✅ SET test:simple = hello")
        
        # 测试读取
        value = await client.get("test:simple")
        print(f"✅ GET test:simple = {value}")
        
        # 查看所有键
        keys = await client.keys("*")
        print(f"✅ 总键数: {len(keys)}")
        
        # 清理
        await client.delete("test:simple")
        await client.close()
        
        print("\n✅ Redis连接测试成功！")
        return True
    
    success = asyncio.run(test())
    
except Exception as e:
    print(f"\n❌ Redis测试失败: {e}")
    import traceback
    traceback.print_exc()

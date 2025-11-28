#!/usr/bin/env python3
"""显示当前数据库配置信息"""

from app.core.config import settings

def show_database_info():
    """显示所有数据库的配置信息"""
    print("🗄️  当前数据库配置信息")
    print("=" * 60)
    
    # PostgreSQL
    print("\n🐘 PostgreSQL:")
    print(f"   启用状态: {'✅ 已启用' if settings.postgres_enabled else '❌ 已禁用'}")
    if settings.postgres_enabled:
        print(f"   连接字符串: {settings.postgres_dsn}")
        # 解析连接信息
        dsn_str = str(settings.postgres_dsn)
        if "localhost" in dsn_str:
            print(f"   主机: localhost")
            print(f"   端口: 5432")
            print(f"   数据库: research")
            print(f"   用户: postgres")
    
    # Neo4j
    print(f"\n🕸️  Neo4j:")
    print(f"   启用状态: {'✅ 已启用' if settings.neo4j_enabled else '❌ 已禁用'}")
    if settings.neo4j_enabled:
        print(f"   URI: {settings.neo4j_uri}")
        print(f"   用户: {settings.neo4j_user}")
        print(f"   数据库: {settings.neo4j_database or 'neo4j (默认)'}")
        print(f"   浏览器访问: http://localhost:7474")
    
    # MongoDB
    print(f"\n🍃 MongoDB:")
    print(f"   启用状态: {'✅ 已启用' if settings.mongo_enabled else '❌ 已禁用'}")
    if settings.mongo_enabled:
        print(f"   连接字符串: {settings.mongo_dsn}")
        print(f"   数据库名称: {settings.mongo_database}")
        print(f"   主机: localhost")
        print(f"   端口: 27017")
    
    # Redis
    print(f"\n🔴 Redis:")
    print(f"   启用状态: {'✅ 已启用' if settings.redis_enabled else '❌ 已禁用'}")
    if settings.redis_enabled:
        print(f"   连接字符串: {settings.redis_dsn}")
        print(f"   主机: localhost")
        print(f"   端口: 6379")
        print(f"   数据库: 0")
    
    print("\n" + "=" * 60)
    print("📋 可视化工具连接配置:")
    print("=" * 60)
    
    if settings.postgres_enabled:
        print("\n🐘 PostgreSQL (pgAdmin/DBeaver):")
        print("   主机: localhost")
        print("   端口: 5432")
        print("   数据库: research")
        print("   用户名: postgres")
        print("   密码: 123456")
    
    if settings.neo4j_enabled:
        print(f"\n🕸️  Neo4j Browser:")
        print("   浏览器访问: http://localhost:7474")
        print(f"   连接URL: {settings.neo4j_uri}")
        print(f"   用户名: {settings.neo4j_user}")
        print("   密码: 12345678")
        print(f"   数据库: {settings.neo4j_database}")
    
    if settings.mongo_enabled:
        print(f"\n🍃 MongoDB Compass:")
        print(f"   连接字符串: {settings.mongo_dsn}")
        print(f"   数据库: {settings.mongo_database}")
    
    if settings.redis_enabled:
        print(f"\n🔴 RedisInsight:")
        print("   主机: localhost")
        print("   端口: 6379")
        print("   数据库: 0")

if __name__ == "__main__":
    show_database_info()

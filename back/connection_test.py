#!/usr/bin/env python3
"""测试数据库连接和数据可见性"""

import asyncio
import psycopg2
from neo4j import GraphDatabase
import pymongo
import redis

from app.core.config import settings


def test_postgresql_direct():
    """直接测试PostgreSQL连接"""
    print("🔍 测试PostgreSQL直接连接...")
    try:
        # 使用psycopg2直接连接
        conn = psycopg2.connect(
            host="localhost",
            port=5432,
            database="research",
            user="postgres",
            password="123456"
        )
        cursor = conn.cursor()
        
        # 检查用户表
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        print(f"✅ PostgreSQL连接成功，用户表有 {user_count} 条记录")
        
        # 显示前几个用户
        cursor.execute("SELECT username, email, role FROM users LIMIT 5")
        users = cursor.fetchall()
        print("👥 用户列表:")
        for username, email, role in users:
            print(f"   - {username} ({role}) - {email}")
        
        cursor.close()
        conn.close()
        
        print(f"💡 PostgreSQL连接信息:")
        print(f"   主机: localhost")
        print(f"   端口: 5432")
        print(f"   数据库: research")
        print(f"   用户: postgres")
        print(f"   密码: 123456")
        
    except Exception as e:
        print(f"❌ PostgreSQL连接失败: {e}")


def test_neo4j_direct():
    """直接测试Neo4j连接"""
    print("\n🔍 测试Neo4j直接连接...")
    try:
        driver = GraphDatabase.driver(
            "bolt://localhost:7687",
            auth=("neo4j", "12345678")
        )
        
        with driver.session() as session:
            # 检查节点数量
            result = session.run("MATCH (n) RETURN count(n) as count")
            count = result.single()["count"]
            print(f"✅ Neo4j连接成功，共有 {count} 个节点")
            
            # 显示研究人员
            result = session.run("MATCH (r:Researcher) RETURN r.name, r.title LIMIT 5")
            print("👨‍🔬 研究人员:")
            for record in result:
                print(f"   - {record['r.name']} ({record['r.title']})")
        
        driver.close()
        
        print(f"💡 Neo4j连接信息:")
        print(f"   Bolt URI: bolt://localhost:7687")
        print(f"   HTTP URI: http://localhost:7474")
        print(f"   用户: neo4j")
        print(f"   密码: 12345678")
        
    except Exception as e:
        print(f"❌ Neo4j连接失败: {e}")


def test_mongodb_direct():
    """直接测试MongoDB连接"""
    print("\n🔍 测试MongoDB直接连接...")
    try:
        client = pymongo.MongoClient("mongodb://localhost:27017")
        db = client["research"]
        
        # 检查集合
        collections = db.list_collection_names()
        print(f"✅ MongoDB连接成功，数据库 'research' 有 {len(collections)} 个集合")
        print(f"📚 集合列表: {collections}")
        
        # 检查论文集合
        if "papers" in collections:
            papers_count = db.papers.count_documents({})
            print(f"📄 论文集合: {papers_count} 篇论文")
            
            # 显示论文标题
            for paper in db.papers.find().limit(3):
                print(f"   - {paper['title']}")
        
        client.close()
        
        print(f"💡 MongoDB连接信息:")
        print(f"   URI: mongodb://localhost:27017")
        print(f"   数据库: research")
        
    except Exception as e:
        print(f"❌ MongoDB连接失败: {e}")


def test_redis_direct():
    """直接测试Redis连接"""
    print("\n🔍 测试Redis直接连接...")
    try:
        client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
        
        # 检查键数量
        keys = client.keys("*")
        print(f"✅ Redis连接成功，共有 {len(keys)} 个键")
        
        # 按类型显示数据
        print("🔑 键值对:")
        for key in keys[:10]:  # 只显示前10个
            key_type = client.type(key)
            if key_type == 'string':
                value = client.get(key)
                print(f"   - {key} (string): {value[:50]}...")
            elif key_type == 'list':
                length = client.llen(key)
                print(f"   - {key} (list): {length} 个元素")
            elif key_type == 'zset':
                length = client.zcard(key)
                print(f"   - {key} (zset): {length} 个元素")
            else:
                print(f"   - {key} ({key_type})")
        
        client.close()
        
        print(f"💡 Redis连接信息:")
        print(f"   主机: localhost")
        print(f"   端口: 6379")
        print(f"   数据库: 0")
        
    except Exception as e:
        print(f"❌ Redis连接失败: {e}")


def main():
    """主函数"""
    print("🔍 数据库连接和数据可见性测试")
    print("=" * 60)
    
    test_postgresql_direct()
    test_neo4j_direct()
    test_mongodb_direct()
    test_redis_direct()
    
    print("\n" + "=" * 60)
    print("📋 可视化软件推荐配置:")
    print("=" * 60)
    
    print("\n🐘 PostgreSQL (推荐: pgAdmin, DBeaver):")
    print("   主机: localhost")
    print("   端口: 5432")
    print("   数据库: research")
    print("   用户名: postgres")
    print("   密码: 123456")
    
    print("\n🕸️  Neo4j (推荐: Neo4j Browser):")
    print("   浏览器访问: http://localhost:7474")
    print("   连接URL: bolt://localhost:7687")
    print("   用户名: neo4j")
    print("   密码: 12345678")
    
    print("\n🍃 MongoDB (推荐: MongoDB Compass):")
    print("   连接字符串: mongodb://localhost:27017")
    print("   数据库: research")
    
    print("\n🔴 Redis (推荐: Redis Desktop Manager, RedisInsight):")
    print("   主机: localhost")
    print("   端口: 6379")
    print("   数据库: 0")


if __name__ == "__main__":
    main()

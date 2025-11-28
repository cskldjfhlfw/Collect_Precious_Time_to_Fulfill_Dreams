#!/usr/bin/env python3
"""详细验证所有数据库中的数据"""

import asyncio
import json
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, text
from neo4j import GraphDatabase
from motor.motor_asyncio import AsyncIOMotorClient
import redis.asyncio as redis

from app.core.config import settings
from app.models.tables import User, Paper, Patent, Project, Competition, Resource, Tag


async def verify_postgresql():
    """验证PostgreSQL数据"""
    print("🔍 验证PostgreSQL数据...")
    print("-" * 50)
    
    engine = create_async_engine(str(settings.postgres_dsn))
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # 检查用户表
        users = await session.execute(select(User))
        user_list = users.scalars().all()
        print(f"👥 用户表: {len(user_list)} 条记录")
        for user in user_list:
            print(f"   - {user.username} ({user.role}) - {user.email}")
        
        # 检查所有表的记录数
        tables = [
            ("papers", "论文"),
            ("patents", "专利"), 
            ("projects", "项目"),
            ("competitions", "竞赛"),
            ("resources", "资源"),
            ("tags", "标签"),
            ("paper_authors", "论文作者"),
            ("project_milestones", "项目里程碑"),
            ("achievement_tags", "成果标签")
        ]
        
        print(f"\n📊 表记录统计:")
        # 定义允许的表名白名单
        allowed_tables = {
            "papers", "patents", "projects", "competitions", "resources", 
            "tags", "paper_authors", "project_milestones", "achievement_tags"
        }
        
        for table_name, chinese_name in tables:
            try:
                # 验证表名是否在白名单中
                if table_name not in allowed_tables:
                    print(f"   {chinese_name}: 跳过 - 非法表名")
                    continue
                
                # 使用参数化查询（但表名不能参数化，所以使用白名单验证）
                from sqlalchemy import table, column, func
                from sqlalchemy.sql import select as sql_select
                
                # 动态构建表对象
                t = table(table_name)
                query = sql_select(func.count()).select_from(t)
                result = await session.execute(query)
                count = result.scalar()
                print(f"   {chinese_name}: {count} 条")
            except Exception as e:
                print(f"   {chinese_name}: 错误 - {e}")
    
    await engine.dispose()


def verify_neo4j():
    """验证Neo4j数据"""
    print("\n🔍 验证Neo4j数据...")
    print("-" * 50)
    
    driver = GraphDatabase.driver(
        settings.neo4j_uri,
        auth=(settings.neo4j_user, settings.neo4j_password)
    )
    
    with driver.session() as session:
        # 统计节点类型
        node_types = ["Researcher", "Field", "Project"]
        for node_type in node_types:
            result = session.run(f"MATCH (n:{node_type}) RETURN count(n) as count")
            count = result.single()["count"]
            print(f"🏷️  {node_type} 节点: {count} 个")
        
        # 显示研究人员详情
        print(f"\n👨‍🔬 研究人员详情:")
        result = session.run("MATCH (r:Researcher) RETURN r.name, r.title, r.field, r.experience")
        for record in result:
            print(f"   - {record['r.name']} ({record['r.title']}) - {record['r.field']} - {record['r.experience']}年经验")
        
        # 显示项目详情
        print(f"\n🚀 项目详情:")
        result = session.run("MATCH (p:Project) RETURN p.name, p.budget, p.status")
        for record in result:
            budget = f"¥{record['p.budget']:,}" if record['p.budget'] else "未知"
            print(f"   - {record['p.name']} - {budget} - {record['p.status']}")
        
        # 显示关系统计
        print(f"\n🔗 关系统计:")
        relationships = ["SPECIALIZES_IN", "LEADS", "PARTICIPATES_IN", "COLLABORATES_WITH"]
        for rel_type in relationships:
            result = session.run(f"MATCH ()-[r:{rel_type}]->() RETURN count(r) as count")
            count = result.single()["count"]
            print(f"   {rel_type}: {count} 个关系")
    
    driver.close()


async def verify_mongodb():
    """验证MongoDB数据"""
    print("\n🔍 验证MongoDB数据...")
    print("-" * 50)
    
    client = AsyncIOMotorClient(settings.mongo_dsn)
    db = client[settings.mongo_database]
    
    # 检查集合
    collections = await db.list_collection_names()
    print(f"📚 集合列表: {collections}")
    
    # 论文集合详情
    if "papers" in collections:
        papers_count = await db.papers.count_documents({})
        print(f"\n📄 论文集合: {papers_count} 篇论文")
        
        async for paper in db.papers.find().limit(3):
            print(f"   - {paper['title']}")
            print(f"     作者: {', '.join(paper['authors'])}")
            print(f"     期刊: {paper['journal']}")
            print(f"     年份: {paper['year']}")
            print(f"     引用数: {paper['citations']}")
    
    # 数据集集合详情
    if "datasets" in collections:
        datasets_count = await db.datasets.count_documents({})
        print(f"\n💾 数据集集合: {datasets_count} 个数据集")
        
        async for dataset in db.datasets.find().limit(3):
            print(f"   - {dataset['name']}")
            print(f"     大小: {dataset['size_gb']} GB")
            print(f"     格式: {dataset['format']}")
            print(f"     样本数: {dataset['samples_count']:,}")
    
    # 实验集合详情
    if "experiments" in collections:
        experiments_count = await db.experiments.count_documents({})
        print(f"\n🧪 实验集合: {experiments_count} 个实验")
        
        async for experiment in db.experiments.find().limit(3):
            print(f"   - {experiment['experiment_name']}")
            print(f"     研究员: {experiment['researcher']}")
            print(f"     状态: {experiment['status']}")
            if 'results' in experiment:
                print(f"     准确率: {experiment['results'].get('accuracy', 'N/A')}")
    
    client.close()


async def verify_redis():
    """验证Redis数据"""
    print("\n🔍 验证Redis数据...")
    print("-" * 50)
    
    client = redis.from_url(str(settings.redis_dsn))
    
    # 获取所有键
    keys = await client.keys("*")
    print(f"🔑 总键数: {len(keys)}")
    
    # 按类型分组显示
    key_types = {}
    for key in keys:
        key_str = key.decode() if isinstance(key, bytes) else key
        key_type = key_str.split(':')[0]
        if key_type not in key_types:
            key_types[key_type] = []
        key_types[key_type].append(key_str)
    
    for key_type, key_list in key_types.items():
        print(f"\n📂 {key_type} 类型: {len(key_list)} 个键")
        for key in key_list[:5]:  # 只显示前5个
            try:
                value = await client.get(key)
                if value:
                    value_str = value.decode() if isinstance(value, bytes) else str(value)
                    # 如果是JSON，尝试解析
                    try:
                        json_data = json.loads(value_str)
                        if isinstance(json_data, dict):
                            print(f"   - {key}: {json_data.get('username', 'JSON对象')}")
                        else:
                            print(f"   - {key}: {value_str[:50]}...")
                    except:
                        print(f"   - {key}: {value_str[:50]}...")
            except Exception as e:
                print(f"   - {key}: 读取错误 - {e}")
    
    # 检查有序集合（热门关键词）
    if b"popular_keywords" in keys or "popular_keywords" in keys:
        print(f"\n🔥 热门关键词排行:")
        keywords = await client.zrevrange("popular_keywords", 0, -1, withscores=True)
        for keyword, score in keywords:
            keyword_str = keyword.decode() if isinstance(keyword, bytes) else keyword
            print(f"   - {keyword_str}: {int(score)} 分")
    
    # 检查列表（最近活动）
    if b"recent_activities" in keys or "recent_activities" in keys:
        print(f"\n📋 最近活动:")
        activities = await client.lrange("recent_activities", 0, -1)
        for activity in activities:
            activity_str = activity.decode() if isinstance(activity, bytes) else activity
            print(f"   - {activity_str}")
    
    await client.aclose()


async def main():
    """主函数"""
    print("🔍 详细验证所有数据库数据")
    print("=" * 60)
    
    try:
        if settings.postgres_enabled:
            await verify_postgresql()
        
        if settings.neo4j_enabled:
            verify_neo4j()
        
        if settings.mongo_enabled:
            await verify_mongodb()
        
        if settings.redis_enabled:
            await verify_redis()
        
        print("\n" + "=" * 60)
        print("✅ 数据验证完成！")
        print("=" * 60)
        
        print("\n💡 数据库连接信息:")
        print(f"   PostgreSQL: {settings.postgres_dsn}")
        print(f"   Neo4j: {settings.neo4j_uri}")
        print(f"   MongoDB: {settings.mongo_dsn}")
        print(f"   Redis: {settings.redis_dsn}")
        
    except Exception as e:
        print(f"💥 验证失败: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())

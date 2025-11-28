#!/usr/bin/env python3
"""Check data in PostgreSQL database."""

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, func

from app.core.config import settings
from app.models.tables import (
    User, Paper, Patent, Project, Competition, Resource, Tag,
    PaperAuthor, ProjectMilestone, ResourceUsageLog, AchievementTag
)


async def check_table_counts(session: AsyncSession):
    """检查各表的数据量"""
    tables = [
        ("用户", User),
        ("论文", Paper),
        ("专利", Patent),
        ("项目", Project),
        ("竞赛", Competition),
        ("资源", Resource),
        ("标签", Tag),
        ("论文作者", PaperAuthor),
        ("项目里程碑", ProjectMilestone),
        ("资源使用日志", ResourceUsageLog),
        ("成果标签", AchievementTag),
    ]
    
    print("📊 数据库表数据统计:")
    print("-" * 40)
    
    total_records = 0
    for table_name, table_class in tables:
        try:
            result = await session.execute(select(func.count()).select_from(table_class))
            count = result.scalar()
            print(f"{table_name:12}: {count:4d} 条记录")
            total_records += count
        except Exception as e:
            print(f"{table_name:12}: 错误 - {e}")
    
    print("-" * 40)
    print(f"{'总计':12}: {total_records:4d} 条记录")
    return total_records


async def show_sample_data(session: AsyncSession):
    """显示部分样本数据"""
    print("\n📋 样本数据预览:")
    print("=" * 50)
    
    # 用户数据
    print("\n👥 用户:")
    users = await session.execute(select(User).limit(5))
    for user in users.scalars():
        print(f"  - {user.username} ({user.role}) - {user.email}")
    
    # 论文数据
    print("\n📄 论文:")
    papers = await session.execute(select(Paper).limit(3))
    for paper in papers.scalars():
        print(f"  - {paper.title[:50]}...")
        print(f"    期刊: {paper.journal or paper.conference}")
        print(f"    状态: {paper.status}")
    
    # 项目数据
    print("\n🚀 项目:")
    projects = await session.execute(select(Project).limit(3))
    for project in projects.scalars():
        print(f"  - {project.name}")
        print(f"    类型: {project.project_type}")
        print(f"    负责人: {project.principal}")
        print(f"    预算: ¥{project.budget:,.2f}")
    
    # 标签数据
    print("\n🏷️  标签:")
    tags = await session.execute(select(Tag).limit(5))
    for tag in tags.scalars():
        print(f"  - {tag.name} ({tag.color})")


async def main():
    """主函数"""
    print("🔍 检查数据库数据状态")
    print(f"📍 环境: {settings.environment}")
    print(f"🗄️  数据库: {settings.postgres_dsn}")
    print("=" * 60)
    
    # 创建数据库连接
    engine = create_async_engine(str(settings.postgres_dsn))
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            # 检查表数据量
            total_records = await check_table_counts(session)
            
            if total_records > 0:
                # 显示样本数据
                await show_sample_data(session)
                print("\n✅ 数据库中有数据")
            else:
                print("\n❌ 数据库中没有数据")
                print("💡 建议运行: python generate_test_data.py --clear")
            
        except Exception as e:
            print(f"💥 检查失败: {e}")
        finally:
            await session.close()
    
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())

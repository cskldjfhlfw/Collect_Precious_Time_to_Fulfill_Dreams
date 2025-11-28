#!/usr/bin/env python3
"""生成扩展测试数据 - 为PostgreSQL数据库生成完整的业务数据

使用方法:
    python generate_extended_test_data.py

注意: 请先运行 generate_multi_db_data.py 创建基础用户数据
"""

import asyncio
from datetime import date
from decimal import Decimal

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

from app.core.config import settings
from app.models.tables import (
    User, Paper, Patent, SoftwareCopyright, Project, Competition,
    Conference, Cooperation, Resource, Tag
)


async def generate_test_data():
    """生成完整的PostgreSQL测试数据"""
    
    engine = create_async_engine(str(settings.postgres_dsn))
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    session = async_session()
    
    try:
        print("📊 开始生成PostgreSQL扩展数据...\n")
        
        # 获取用户ID映射
        users_result = await session.execute(select(User))
        users_list = users_result.scalars().all()
        user_map = {u.username: u.id for u in users_list}
        
        if not user_map:
            print("⚠️  警告: 未找到用户数据，请先运行 generate_multi_db_data.py")
            return
        
        print(f"✓ 找到 {len(user_map)} 个用户\n")
        
        # 1. 标签
        print("1️⃣  创建标签...")
        tags_data = [
            {"name": "人工智能", "color": "#FF5733"},
            {"name": "机器学习", "color": "#33FF57"},
            {"name": "深度学习", "color": "#3357FF"},
            {"name": "区块链", "color": "#FF33F5"},
            {"name": "计算机视觉", "color": "#F5FF33"},
            {"name": "自然语言处理", "color": "#33F5FF"},
        ]
        
        for tag_data in tags_data:
            existing = await session.execute(select(Tag).where(Tag.name == tag_data["name"]))
            if not existing.scalar_one_or_none():
                session.add(Tag(**tag_data))
        await session.commit()
        print(f"   ✅ 创建了 {len(tags_data)} 个标签\n")
        
        # 2. 论文
        print("2️⃣  创建论文...")
        papers_data = [
            {
                "title": "基于深度学习的图像识别算法研究",
                "authors": {"list": ["张伟", "李明"]},
                "journal": "计算机学报",
                "publish_date": date(2023, 6, 15),
                "doi": "10.11897/SP.J.1016.2023.01234",
                "abstract": "本文提出了一种基于深度学习的图像识别算法。",
                "keywords": ["深度学习", "图像识别"],
                "citation_count": 25,
                "impact_factor": Decimal("3.85"),
                "writing_progress": 100,
                "status": "published",
                "created_by": user_map.get("zhang_wei")
            },
            {
                "title": "区块链技术在供应链管理中的应用",
                "authors": {"list": ["王芳"]},
                "journal": "软件学报",
                "publish_date": date(2023, 8, 20),
                "doi": "10.13328/j.cnki.jos.006789",
                "abstract": "探讨了区块链技术在供应链管理中的应用。",
                "keywords": ["区块链", "供应链"],
                "citation_count": 18,
                "impact_factor": Decimal("2.94"),
                "writing_progress": 100,
                "status": "published",
                "created_by": user_map.get("wang_fang")
            },
        ]
        
        for paper_data in papers_data:
            session.add(Paper(**paper_data))
        await session.commit()
        print(f"   ✅ 创建了 {len(papers_data)} 篇论文\n")
        
        # 3. 专利
        print("3️⃣  创建专利...")
        patents_data = [
            {
                "name": "一种基于人工智能的图像处理系统及方法",
                "patent_number": "CN202310123456.7",
                "inventors": {"list": ["张伟", "李明"]},
                "application_date": date(2023, 3, 15),
                "authorization_date": date(2023, 9, 20),
                "patent_type": "invention",
                "status": "authorized",
                "technology_field": "人工智能",
                "created_by": user_map.get("zhang_wei")
            },
            {
                "name": "区块链数据存储装置",
                "patent_number": "CN202310234567.8",
                "inventors": {"list": ["王芳"]},
                "application_date": date(2023, 5, 10),
                "patent_type": "utility_model",
                "status": "reviewing",
                "technology_field": "区块链",
                "created_by": user_map.get("wang_fang")
            },
        ]
        
        for patent_data in patents_data:
            session.add(Patent(**patent_data))
        await session.commit()
        print(f"   ✅ 创建了 {len(patents_data)} 个专利\n")
        
        # 4. 软件著作权
        print("4️⃣  创建软件著作权...")
        software_data = [
            {
                "name": "智能图像识别系统V1.0",
                "registration_number": "2023SR0123456",
                "developers": {"list": ["张伟", "李明"]},
                "registration_date": date(2023, 7, 1),
                "version": "1.0",
                "category": "应用软件",
                "development_language": "Python",
                "status": "registered",
                "created_by": user_map.get("zhang_wei")
            },
            {
                "name": "区块链供应链管理平台V2.0",
                "registration_number": "2023SR0234567",
                "developers": {"list": ["王芳"]},
                "registration_date": date(2023, 8, 15),
                "version": "2.0",
                "category": "平台软件",
                "development_language": "Go",
                "status": "registered",
                "created_by": user_map.get("wang_fang")
            },
        ]
        
        for soft_data in software_data:
            session.add(SoftwareCopyright(**soft_data))
        await session.commit()
        print(f"   ✅ 创建了 {len(software_data)} 个软件著作权\n")
        
        # 5. 项目
        print("5️⃣  创建项目...")
        projects_data = [
            {
                "name": "智能制造关键技术研究",
                "project_number": "2023YFB1234567",
                "project_type": "national",
                "principal": "张伟",
                "start_date": date(2023, 1, 1),
                "end_date": date(2025, 12, 31),
                "budget": Decimal("2000000.00"),
                "status": "in_progress",
                "progress_percent": 40,
                "description": "研究智能制造领域的关键技术。",
                "created_by": user_map.get("zhang_wei")
            },
            {
                "name": "新一代人工智能算法优化",
                "project_number": "2023JJ0123",
                "project_type": "provincial",
                "principal": "李明",
                "start_date": date(2023, 3, 1),
                "end_date": date(2024, 12, 31),
                "budget": Decimal("500000.00"),
                "status": "in_progress",
                "progress_percent": 30,
                "description": "研究新一代人工智能算法的优化方法。",
                "created_by": user_map.get("li_ming")
            },
        ]
        
        for project_data in projects_data:
            session.add(Project(**project_data))
        await session.commit()
        print(f"   ✅ 创建了 {len(projects_data)} 个项目\n")
        
        # 6. 竞赛
        print("6️⃣  创建竞赛...")
        competitions_data = [
            {
                "name": "全国大学生人工智能创新大赛",
                "level": "national",
                "award_level": "一等奖",
                "award_date": date(2023, 10, 15),
                "progress_percent": 100,
                "mentor": "张伟",
                "team_members": {"list": ["陈浩"]},
                "status": "completed",
                "created_by": user_map.get("zhang_wei")
            },
            {
                "name": "省大学生计算机设计大赛",
                "level": "provincial",
                "award_level": "二等奖",
                "award_date": date(2023, 6, 20),
                "progress_percent": 100,
                "mentor": "王芳",
                "team_members": {"list": ["李四"]},
                "status": "completed",
                "created_by": user_map.get("wang_fang")
            },
        ]
        
        for comp_data in competitions_data:
            session.add(Competition(**comp_data))
        await session.commit()
        print(f"   ✅ 创建了 {len(competitions_data)} 个竞赛记录\n")
        
        # 7. 会议 ⭐
        print("7️⃣  创建会议...")
        conferences_data = [
            {
                "name": "2023国际人工智能大会 (IJCAI 2023)",
                "level": "CCF A",
                "location": "北京国家会议中心",
                "start_date": date(2023, 8, 19),
                "end_date": date(2023, 8, 25),
                "participation_type": "oral",
                "submission_status": "accepted",
                "travel_budget": Decimal("15000.00"),
                "visa_required": False,
                "participants": {"list": ["张伟", "李明"]},
                "description": "在大会上做了口头报告，介绍了最新的图像识别算法研究成果。",
                "created_by": user_map.get("zhang_wei")
            },
            {
                "name": "2023中国区块链技术与应用峰会",
                "level": "国家级",
                "location": "上海世博展览馆",
                "start_date": date(2023, 9, 10),
                "end_date": date(2023, 9, 12),
                "participation_type": "poster",
                "submission_status": "accepted",
                "travel_budget": Decimal("8000.00"),
                "visa_required": False,
                "participants": {"list": ["王芳"]},
                "description": "以海报形式展示了区块链在供应链中的应用研究。",
                "created_by": user_map.get("wang_fang")
            },
            {
                "name": "第十届中国自然语言处理学术会议",
                "level": "CCF B",
                "location": "深圳大学",
                "start_date": date(2023, 11, 3),
                "end_date": date(2023, 11, 5),
                "participation_type": "oral",
                "submission_status": "accepted",
                "travel_budget": Decimal("6000.00"),
                "visa_required": False,
                "participants": {"list": ["李明"]},
                "description": "作为特邀报告人，分享了NLP预训练模型的最新研究。",
                "created_by": user_map.get("li_ming")
            },
        ]
        
        for conf_data in conferences_data:
            session.add(Conference(**conf_data))
        await session.commit()
        print(f"   ✅ 创建了 {len(conferences_data)} 个会议记录\n")
        
        # 8. 合作 ⭐
        print("8️⃣  创建合作...")
        cooperations_data = [
            {
                "organization": "华为技术有限公司",
                "content": "共同开展智能制造领域的技术研发，建立联合实验室。已发表论文3篇，申请专利2项。",
                "start_date": date(2023, 1, 1),
                "end_date": date(2025, 12, 31),
                "cooperation_type": "校企合作",
                "status": "in_progress",
                "cooperation_value": Decimal("5000000.00"),
                "contact_person": "张伟",
                "contact_email": "zhang.wei@research.edu",
                "created_by": user_map.get("zhang_wei")
            },
            {
                "organization": "MIT Media Lab",
                "content": "与MIT媒体实验室开展区块链技术的联合研究和学术交流。",
                "start_date": date(2023, 6, 1),
                "end_date": date(2024, 6, 1),
                "cooperation_type": "学术交流",
                "status": "in_progress",
                "contact_person": "王芳",
                "contact_email": "wang.fang@research.edu",
                "created_by": user_map.get("wang_fang")
            },
            {
                "organization": "科大讯飞股份有限公司",
                "content": "合作开发智能语音技术及其产业应用。",
                "start_date": date(2023, 3, 1),
                "end_date": date(2024, 2, 29),
                "cooperation_type": "产学研合作",
                "status": "in_progress",
                "cooperation_value": Decimal("1000000.00"),
                "contact_person": "李明",
                "contact_email": "li.ming@research.edu",
                "created_by": user_map.get("li_ming")
            },
        ]
        
        for coop_data in cooperations_data:
            session.add(Cooperation(**coop_data))
        await session.commit()
        print(f"   ✅ 创建了 {len(cooperations_data)} 个合作记录\n")
        
        # 9. 资源
        print("9️⃣  创建资源...")
        resources_data = [
            {
                "name": "GPU计算集群",
                "resource_type": "计算资源",
                "description": "用于深度学习训练的高性能GPU计算集群。",
                "maintainer": "张伟",
                "download_count": 0,
                "tags": ["GPU", "深度学习"],
                "is_public": False,
                "created_by": user_map.get("admin")
            },
            {
                "name": "区块链测试网络",
                "resource_type": "网络资源",
                "description": "用于区块链应用开发和测试的专用网络环境。",
                "maintainer": "王芳",
                "download_count": 0,
                "tags": ["区块链", "测试环境"],
                "is_public": False,
                "created_by": user_map.get("admin")
            },
        ]
        
        for resource_data in resources_data:
            session.add(Resource(**resource_data))
        await session.commit()
        print(f"   ✅ 创建了 {len(resources_data)} 个资源记录\n")
        
        print("=" * 60)
        print("✅ PostgreSQL扩展数据生成完成！")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ 生成失败: {e}")
        import traceback
        traceback.print_exc()
        await session.rollback()
        raise
    finally:
        await session.close()
        await engine.dispose()


async def main():
    """主函数"""
    print("\n" + "=" * 60)
    print("🚀 PostgreSQL扩展测试数据生成器")
    print("=" * 60 + "\n")
    
    await generate_test_data()


if __name__ == "__main__":
    asyncio.run(main())

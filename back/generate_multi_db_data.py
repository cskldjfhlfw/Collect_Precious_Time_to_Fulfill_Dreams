#!/usr/bin/env python3
"""Generate test data for all databases (PostgreSQL, Neo4j, MongoDB, Redis)."""

import asyncio
import json
import random
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import List, Dict, Any
from uuid import uuid4

# PostgreSQL imports
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

# Neo4j imports
from neo4j import GraphDatabase

# MongoDB imports
from motor.motor_asyncio import AsyncIOMotorClient

# Redis imports
import redis.asyncio as redis

from app.core.config import settings
from app.models.tables import (
    User, Paper, Patent, SoftwareCopyright, Project, Competition,
    Conference, Cooperation, Resource, Relationship, ResourceAchievement,
    Tag, AchievementTag, PaperAuthor, ProjectMilestone, Reminder,
    ResourceUsageLog, ResourceMaintenanceTask, SearchSavedView
)


class MultiDatabaseTestDataGenerator:
    """多数据库测试数据生成器"""
    
    def __init__(self):
        self.pg_engine = None
        self.pg_session = None
        self.neo4j_driver = None
        self.mongo_client = None
        self.mongo_db = None
        self.redis_client = None
        
        # 存储生成的数据ID映射
        self.user_ids = {}
        self.paper_ids = {}
        self.patent_ids = {}
        self.software_ids = {}
        self.project_ids = {}
        self.competition_ids = {}
        self.conference_ids = {}
        self.cooperation_ids = {}
        self.resource_ids = {}
        self.tag_ids = {}
    
    async def connect_databases(self):
        """连接所有数据库"""
        print("🔌 连接数据库...")
        
        # PostgreSQL
        if settings.postgres_enabled:
            self.pg_engine = create_async_engine(str(settings.postgres_dsn))
            async_session = sessionmaker(self.pg_engine, class_=AsyncSession, expire_on_commit=False)
            self.pg_session = async_session()
            print("✅ PostgreSQL 连接成功")
        
        # Neo4j
        if settings.neo4j_enabled:
            self.neo4j_driver = GraphDatabase.driver(
                settings.neo4j_uri,
                auth=(settings.neo4j_user, settings.neo4j_password)
            )
            self.neo4j_database = settings.neo4j_database or "neo4j"
            print(f"✅ Neo4j 连接成功 (数据库: {self.neo4j_database})")
        
        # MongoDB
        if settings.mongo_enabled:
            self.mongo_client = AsyncIOMotorClient(settings.mongo_dsn)
            self.mongo_db = self.mongo_client[settings.mongo_database]
            print("✅ MongoDB 连接成功")
        
        # Redis
        if settings.redis_enabled:
            self.redis_client = redis.from_url(str(settings.redis_dsn))
            print("✅ Redis 连接成功")
    
    async def close_connections(self):
        """关闭所有数据库连接"""
        print("🔌 关闭数据库连接...")
        
        if self.pg_session:
            await self.pg_session.close()
        if self.pg_engine:
            await self.pg_engine.dispose()
        if self.neo4j_driver:
            self.neo4j_driver.close()
        if self.mongo_client:
            self.mongo_client.close()
        if self.redis_client:
            await self.redis_client.aclose()
    
    async def generate_postgresql_data(self):
        """生成PostgreSQL测试数据"""
        if not self.pg_session:
            return
        
        print("📊 生成PostgreSQL数据...")
        
        # 创建用户
        users_data = [
            {"username": "admin", "email": "admin@research.edu", "role": "admin"},
            {"username": "zhang_wei", "email": "zhang.wei@research.edu", "role": "researcher"},
            {"username": "li_ming", "email": "li.ming@research.edu", "role": "researcher"},
            {"username": "wang_fang", "email": "wang.fang@research.edu", "role": "student"},
        ]
        
        for user_data in users_data:
            # 检查用户是否已存在
            existing = await self.pg_session.execute(
                select(User).where(User.username == user_data["username"])
            )
            existing_user = existing.scalar_one_or_none()
            
            if not existing_user:
                user = User(
                    username=user_data["username"],
                    email=user_data["email"],
                    password_hash="$2b$12$dummy_hash_for_testing",
                    role=user_data["role"]
                )
                self.pg_session.add(user)
                await self.pg_session.commit()
                await self.pg_session.refresh(user)
                self.user_ids[user_data["username"]] = str(user.id)
            else:
                self.user_ids[user_data["username"]] = str(existing_user.id)
        
        print(f"✅ PostgreSQL: 创建了 {len(users_data)} 个用户")
    
    def generate_neo4j_data(self):
        """生成Neo4j测试数据"""
        if not self.neo4j_driver:
            return
        
        print("🕸️  生成Neo4j数据...")
        
        with self.neo4j_driver.session(database=self.neo4j_database) as session:
            # 清理现有数据
            session.run("MATCH (n) DETACH DELETE n")
            
            # 创建研究人员节点
            researchers = [
                {"name": "张伟", "title": "教授", "field": "人工智能", "experience": 15},
                {"name": "李明", "title": "副教授", "field": "机器学习", "experience": 10},
                {"name": "王芳", "title": "讲师", "field": "深度学习", "experience": 5},
                {"name": "陈浩", "title": "研究生", "field": "计算机视觉", "experience": 2},
            ]
            
            for researcher in researchers:
                session.run(
                    "CREATE (r:Researcher {name: $name, title: $title, field: $field, experience: $experience})",
                    **researcher
                )
            
            # 创建研究领域节点
            fields = ["人工智能", "机器学习", "深度学习", "计算机视觉", "自然语言处理", "区块链"]
            for field in fields:
                session.run("CREATE (f:Field {name: $name})", name=field)
            
            # 创建项目节点
            projects = [
                {"name": "智能制造关键技术研究", "budget": 2000000, "status": "进行中", "type": "research"},
                {"name": "新一代人工智能算法优化", "budget": 800000, "status": "进行中", "type": "research"},
                {"name": "区块链安全技术产业化应用", "budget": 1500000, "status": "进行中", "type": "application"},
            ]
            
            for project in projects:
                session.run(
                    "CREATE (p:Project {name: $name, budget: $budget, status: $status, type: $type})",
                    **project
                )
            
            # 创建机构节点
            institutions = [
                {"name": "清华大学", "type": "university", "country": "中国"},
                {"name": "华为技术有限公司", "type": "enterprise", "country": "中国"},
                {"name": "MIT Media Lab", "type": "research_institute", "country": "美国"},
                {"name": "科大讯飞股份有限公司", "type": "enterprise", "country": "中国"},
            ]
            
            for institution in institutions:
                session.run(
                    "CREATE (i:Institution {name: $name, type: $type, country: $country})",
                    **institution
                )
            
            # 创建会议节点
            conferences = [
                {"name": "IJCAI 2023", "location": "北京", "level": "A类", "year": 2023},
                {"name": "CBTAS 2023", "location": "上海", "level": "国家级", "year": 2023},
                {"name": "CCL 2023", "location": "深圳", "level": "B类", "year": 2023},
            ]
            
            for conf in conferences:
                session.run(
                    "CREATE (c:Conference {name: $name, location: $location, level: $level, year: $year})",
                    **conf
                )
            
            # 创建关系
            relationships = [
                # 研究人员专长领域
                ("MATCH (r:Researcher {name: '张伟'}), (f:Field {name: '人工智能'}) CREATE (r)-[:SPECIALIZES_IN]->(f)", {}),
                ("MATCH (r:Researcher {name: '李明'}), (f:Field {name: '机器学习'}) CREATE (r)-[:SPECIALIZES_IN]->(f)", {}),
                ("MATCH (r:Researcher {name: '王芳'}), (f:Field {name: '深度学习'}) CREATE (r)-[:SPECIALIZES_IN]->(f)", {}),
                
                # 项目负责人
                ("MATCH (r:Researcher {name: '张伟'}), (p:Project {name: '智能制造关键技术研究'}) CREATE (r)-[:LEADS]->(p)", {}),
                ("MATCH (r:Researcher {name: '李明'}), (p:Project {name: '新一代人工智能算法优化'}) CREATE (r)-[:LEADS]->(p)", {}),
                
                # 项目合作
                ("MATCH (r:Researcher {name: '王芳'}), (p:Project {name: '智能制造关键技术研究'}) CREATE (r)-[:PARTICIPATES_IN]->(p)", {}),
                ("MATCH (r:Researcher {name: '陈浩'}), (p:Project {name: '新一代人工智能算法优化'}) CREATE (r)-[:PARTICIPATES_IN]->(p)", {}),
                
                # 研究人员合作关系
                ("MATCH (r1:Researcher {name: '张伟'}), (r2:Researcher {name: '李明'}) CREATE (r1)-[:COLLABORATES_WITH {since: 2020, papers: 5}]->(r2)", {}),
                ("MATCH (r1:Researcher {name: '李明'}), (r2:Researcher {name: '王芳'}) CREATE (r1)-[:COLLABORATES_WITH {since: 2021, papers: 3}]->(r2)", {}),
                
                # 研究人员所属机构
                ("MATCH (r:Researcher {name: '张伟'}), (i:Institution {name: '清华大学'}) CREATE (r)-[:AFFILIATED_WITH]->(i)", {}),
                ("MATCH (r:Researcher {name: '李明'}), (i:Institution {name: '清华大学'}) CREATE (r)-[:AFFILIATED_WITH]->(i)", {}),
                ("MATCH (r:Researcher {name: '王芳'}), (i:Institution {name: '清华大学'}) CREATE (r)-[:AFFILIATED_WITH]->(i)", {}),
                
                # 机构合作关系
                ("MATCH (i1:Institution {name: '清华大学'}), (i2:Institution {name: '华为技术有限公司'}) CREATE (i1)-[:COOPERATES_WITH {type: '校企合作', start_year: 2023}]->(i2)", {}),
                ("MATCH (i1:Institution {name: '清华大学'}), (i2:Institution {name: 'MIT Media Lab'}) CREATE (i1)-[:COOPERATES_WITH {type: '学术交流', start_year: 2023}]->(i2)", {}),
                ("MATCH (i1:Institution {name: '清华大学'}), (i2:Institution {name: '科大讯飞股份有限公司'}) CREATE (i1)-[:COOPERATES_WITH {type: '产学研合作', start_year: 2023}]->(i2)", {}),
                
                # 研究人员参加会议
                ("MATCH (r:Researcher {name: '张伟'}), (c:Conference {name: 'IJCAI 2023'}) CREATE (r)-[:ATTENDED {role: 'speaker'}]->(c)", {}),
                ("MATCH (r:Researcher {name: '王芳'}), (c:Conference {name: 'CBTAS 2023'}) CREATE (r)-[:ATTENDED {role: 'poster'}]->(c)", {}),
                ("MATCH (r:Researcher {name: '李明'}), (c:Conference {name: 'CCL 2023'}) CREATE (r)-[:ATTENDED {role: 'speaker'}]->(c)", {}),
            ]
            
            for query, params in relationships:
                session.run(query, **params)
        
        print("✅ Neo4j: 创建了研究人员、项目、机构、会议和关系网络")
    
    async def generate_mongodb_data(self):
        """生成MongoDB测试数据"""
        if self.mongo_db is None:
            return
        
        print("🍃 生成MongoDB数据...")
        
        # 论文集合
        papers_collection = self.mongo_db.papers
        papers_data = [
            {
                "_id": str(uuid4()),
                "title": "基于深度学习的图像识别算法研究",
                "authors": ["张伟", "李明"],
                "journal": "计算机学报",
                "year": 2023,
                "keywords": ["深度学习", "图像识别", "卷积神经网络"],
                "abstract": "本文提出了一种基于深度学习的图像识别算法...",
                "citations": 25,
                "impact_factor": 3.85,
                "full_text": {
                    "introduction": "随着人工智能技术的快速发展...",
                    "methodology": "本研究采用改进的卷积神经网络...",
                    "results": "实验结果表明，提出的算法...",
                    "conclusion": "本文成功开发了一种新的图像识别算法..."
                },
                "metadata": {
                    "created_at": datetime.now(),
                    "updated_at": datetime.now(),
                    "status": "published",
                    "peer_reviewed": True
                }
            },
            {
                "_id": str(uuid4()),
                "title": "区块链技术在供应链管理中的应用",
                "authors": ["王芳", "陈浩"],
                "journal": "软件学报",
                "year": 2023,
                "keywords": ["区块链", "供应链", "智能合约"],
                "abstract": "研究了区块链技术在供应链管理中的应用场景...",
                "citations": 18,
                "impact_factor": 2.94,
                "full_text": {
                    "introduction": "供应链管理是现代企业运营的核心...",
                    "methodology": "本研究设计了基于区块链的供应链系统...",
                    "results": "系统测试显示，区块链技术能够...",
                    "conclusion": "区块链技术为供应链管理提供了新的解决方案..."
                },
                "metadata": {
                    "created_at": datetime.now(),
                    "updated_at": datetime.now(),
                    "status": "published",
                    "peer_reviewed": True
                }
            }
        ]
        
        await papers_collection.insert_many(papers_data)
        
        # 研究数据集合
        datasets_collection = self.mongo_db.datasets
        datasets_data = [
            {
                "_id": str(uuid4()),
                "name": "ImageNet-Research",
                "description": "用于图像识别研究的大型数据集",
                "size_gb": 150.5,
                "format": "JPEG",
                "samples_count": 1000000,
                "labels": ["动物", "植物", "建筑", "交通工具"],
                "access_level": "public",
                "download_count": 2500,
                "created_by": "张伟",
                "created_at": datetime.now(),
                "tags": ["计算机视觉", "深度学习", "图像分类"]
            },
            {
                "_id": str(uuid4()),
                "name": "Blockchain-Transactions",
                "description": "区块链交易数据集",
                "size_gb": 45.2,
                "format": "JSON",
                "samples_count": 500000,
                "access_level": "restricted",
                "download_count": 150,
                "created_by": "王芳",
                "created_at": datetime.now(),
                "tags": ["区块链", "金融科技", "数据挖掘"]
            }
        ]
        
        await datasets_collection.insert_many(datasets_data)
        
        # 实验记录集合
        experiments_collection = self.mongo_db.experiments
        experiments_data = [
            {
                "_id": str(uuid4()),
                "experiment_name": "CNN模型性能测试",
                "researcher": "李明",
                "start_time": datetime.now() - timedelta(days=5),
                "end_time": datetime.now() - timedelta(days=2),
                "parameters": {
                    "learning_rate": 0.001,
                    "batch_size": 32,
                    "epochs": 100,
                    "optimizer": "Adam"
                },
                "results": {
                    "accuracy": 0.95,
                    "precision": 0.93,
                    "recall": 0.94,
                    "f1_score": 0.935
                },
                "notes": "模型在验证集上表现良好，准确率达到95%",
                "status": "completed"
            }
        ]
        
        await experiments_collection.insert_many(experiments_data)
        
        # 会议资料集合
        conferences_collection = self.mongo_db.conference_materials
        conferences_data = [
            {
                "_id": str(uuid4()),
                "conference_name": "IJCAI 2023",
                "paper_title": "基于深度学习的图像识别算法研究",
                "presenter": "张伟",
                "presentation_type": "oral",
                "slides_url": "https://storage.research.edu/slides/ijcai2023_zhang.pdf",
                "video_url": "https://video.research.edu/ijcai2023_zhang.mp4",
                "qa_summary": "与会者对算法的创新性给予高度评价，讨论了实际应用场景。",
                "attendance": 150,
                "feedback_score": 4.8,
                "created_at": datetime.now()
            },
            {
                "_id": str(uuid4()),
                "conference_name": "CBTAS 2023",
                "paper_title": "区块链技术在供应链管理中的应用",
                "presenter": "王芳",
                "presentation_type": "poster",
                "poster_url": "https://storage.research.edu/posters/cbtas2023_wang.pdf",
                "qa_summary": "企业代表对区块链在供应链中的应用前景表示浓厚兴趣。",
                "attendance": 80,
                "feedback_score": 4.5,
                "created_at": datetime.now()
            }
        ]
        
        await conferences_collection.insert_many(conferences_data)
        
        # 合作项目文档集合
        cooperation_docs_collection = self.mongo_db.cooperation_documents
        cooperation_docs_data = [
            {
                "_id": str(uuid4()),
                "cooperation_name": "校企合作-智能制造联合实验室",
                "partner": "华为技术有限公司",
                "documents": [
                    {"type": "合作协议", "url": "/docs/agreements/huawei_agreement.pdf", "upload_date": datetime.now()},
                    {"type": "技术方案", "url": "/docs/proposals/ai_manufacturing.pdf", "upload_date": datetime.now()},
                    {"type": "进度报告", "url": "/docs/reports/2023_q3_report.pdf", "upload_date": datetime.now()}
                ],
                "meetings": [
                    {"date": datetime.now() - timedelta(days=30), "topic": "项目启动会", "attendees": ["张伟", "华为代表"]},
                    {"date": datetime.now() - timedelta(days=15), "topic": "技术交流会", "attendees": ["张伟", "李明", "华为技术团队"]}
                ],
                "status": "active"
            },
            {
                "_id": str(uuid4()),
                "cooperation_name": "国际合作-中美区块链技术联合研究",
                "partner": "MIT Media Lab",
                "documents": [
                    {"type": "MOU", "url": "/docs/agreements/mit_mou.pdf", "upload_date": datetime.now()},
                    {"type": "研究计划", "url": "/docs/proposals/blockchain_research.pdf", "upload_date": datetime.now()}
                ],
                "meetings": [
                    {"date": datetime.now() - timedelta(days=60), "topic": "项目启动视频会议", "attendees": ["王芳", "MIT教授"]}
                ],
                "status": "active"
            }
        ]
        
        await cooperation_docs_collection.insert_many(cooperation_docs_data)
        
        # 专利文档集合
        patents_collection = self.mongo_db.patent_documents
        patents_data = [
            {
                "_id": str(uuid4()),
                "patent_title": "一种基于人工智能的图像处理系统及方法",
                "patent_number": "CN202310123456.7",
                "full_text": {
                    "abstract": "本发明公开了一种基于人工智能的图像处理系统及方法...",
                    "claims": "1. 一种基于人工智能的图像处理系统，其特征在于...",
                    "description": "技术领域：本发明涉及人工智能和图像处理技术领域..."
                },
                "figures": [
                    {"figure_num": 1, "caption": "系统架构图", "url": "/patents/figs/fig1.png"},
                    {"figure_num": 2, "caption": "算法流程图", "url": "/patents/figs/fig2.png"}
                ],
                "citations": ["CN201810123456.7", "US20190123456A1"],
                "status": "granted",
                "created_at": datetime.now()
            }
        ]
        
        await patents_collection.insert_many(patents_data)
        
        # 资源使用日志集合
        resource_logs_collection = self.mongo_db.resource_usage_logs
        resource_logs_data = [
            {
                "_id": str(uuid4()),
                "resource_name": "GPU计算集群",
                "user": "张伟",
                "task": "图像识别模型训练",
                "start_time": datetime.now() - timedelta(hours=5),
                "end_time": datetime.now() - timedelta(hours=2),
                "gpu_hours": 48,
                "memory_used_gb": 512,
                "status": "completed"
            },
            {
                "_id": str(uuid4()),
                "resource_name": "GPU计算集群",
                "user": "李明",
                "task": "NLP模型微调",
                "start_time": datetime.now() - timedelta(hours=3),
                "end_time": None,
                "gpu_hours": 12,
                "memory_used_gb": 256,
                "status": "running"
            }
        ]
        
        await resource_logs_collection.insert_many(resource_logs_data)
        
        print("✅ MongoDB: 创建了论文、数据集、实验记录、会议资料、合作文档、专利文档和资源日志")
    
    async def generate_redis_data(self):
        """生成Redis测试数据"""
        if not self.redis_client:
            return
        
        print("🔴 生成Redis数据...")
        
        # 用户会话数据
        sessions = {
            "session:admin": json.dumps({
                "user_id": self.user_ids.get("admin", "unknown"),
                "username": "admin",
                "role": "admin",
                "login_time": datetime.now().isoformat(),
                "last_activity": datetime.now().isoformat(),
                "permissions": ["read", "write", "admin"]
            }),
            "session:zhang_wei": json.dumps({
                "user_id": self.user_ids.get("zhang_wei", "unknown"),
                "username": "zhang_wei",
                "role": "researcher",
                "login_time": (datetime.now() - timedelta(hours=2)).isoformat(),
                "last_activity": datetime.now().isoformat(),
                "permissions": ["read", "write"]
            })
        }
        
        for key, value in sessions.items():
            await self.redis_client.setex(key, 3600, value)  # 1小时过期
        
        # 系统统计数据
        stats = {
            "stats:papers:total": 25,
            "stats:papers:published": 20,
            "stats:papers:draft": 5,
            "stats:users:total": 15,
            "stats:users:active": 12,
            "stats:projects:total": 8,
            "stats:projects:ongoing": 5,
            "stats:downloads:today": 45,
            "stats:api_calls:today": 1250
        }
        
        for key, value in stats.items():
            await self.redis_client.set(key, value)
        
        # 缓存热门搜索关键词
        popular_keywords = [
            "人工智能", "机器学习", "深度学习", "区块链", 
            "计算机视觉", "自然语言处理", "数据挖掘"
        ]
        
        for i, keyword in enumerate(popular_keywords):
            await self.redis_client.zadd("popular_keywords", {keyword: len(popular_keywords) - i})
        
        # 缓存最近活动
        recent_activities = [
            "张伟发表了新论文《基于深度学习的图像识别算法研究》",
            "李明创建了新项目《新一代人工智能算法优化》",
            "王芳上传了新数据集《区块链交易数据》",
            "陈浩完成了实验《CNN模型性能测试》"
        ]
        
        for activity in recent_activities:
            await self.redis_client.lpush("recent_activities", activity)
        
        # 设置过期时间（24小时）
        await self.redis_client.expire("recent_activities", 86400)
        
        # 研究人员排行榜（按论文数量）
        researcher_rankings = {
            "张伟": 25,
            "李明": 18,
            "王芳": 15,
            "陈浩": 8
        }
        
        for researcher, score in researcher_rankings.items():
            await self.redis_client.zadd("researcher_rankings:papers", {researcher: score})
        
        # 项目进度缓存
        project_progress = {
            "project:智能制造关键技术研究": json.dumps({
                "progress_percentage": 65,
                "current_phase": "中期评估",
                "next_milestone": "原型系统开发",
                "last_updated": datetime.now().isoformat()
            }),
            "project:新一代人工智能算法优化": json.dumps({
                "progress_percentage": 45,
                "current_phase": "算法研发",
                "next_milestone": "性能测试",
                "last_updated": datetime.now().isoformat()
            })
        }
        
        for key, value in project_progress.items():
            await self.redis_client.setex(key, 7200, value)  # 2小时过期
        
        # 通知队列
        notifications = [
            json.dumps({"type": "project_milestone", "message": "项目里程碑已完成", "project": "智能制造关键技术研究", "timestamp": datetime.now().isoformat()}),
            json.dumps({"type": "paper_accepted", "message": "论文被IJCAI 2024接收", "author": "张伟", "timestamp": datetime.now().isoformat()}),
            json.dumps({"type": "resource_available", "message": "GPU集群资源已释放", "resource": "GPU计算集群", "timestamp": datetime.now().isoformat()}),
        ]
        
        for notification in notifications:
            await self.redis_client.lpush("notifications", notification)
        
        await self.redis_client.expire("notifications", 604800)  # 7天过期
        
        # API速率限制（每用户每小时请求次数）
        rate_limits = {
            "rate_limit:user:admin": 50,
            "rate_limit:user:zhang_wei": 35,
            "rate_limit:user:li_ming": 28
        }
        
        for key, count in rate_limits.items():
            await self.redis_client.setex(key, 3600, count)
        
        # 缓存热门论文
        popular_papers = [
            "基于深度学习的图像识别算法研究",
            "区块链技术在供应链管理中的应用研究",
            "自然语言处理中的预训练模型研究进展"
        ]
        
        for i, paper in enumerate(popular_papers):
            await self.redis_client.zadd("popular_papers", {paper: 100 - i * 10})
        
        # 在线用户集合
        online_users = ["admin", "zhang_wei", "li_ming"]
        for user in online_users:
            await self.redis_client.sadd("online_users", user)
        
        await self.redis_client.expire("online_users", 1800)  # 30分钟过期
        
        # 缓存会议日程
        conference_schedule = {
            "conference:IJCAI2023:day1": json.dumps({
                "date": "2023-08-19",
                "sessions": [
                    {"time": "09:00-10:30", "topic": "Deep Learning"},
                    {"time": "11:00-12:30", "topic": "Computer Vision"}
                ]
            }),
            "conference:IJCAI2023:day2": json.dumps({
                "date": "2023-08-20",
                "sessions": [
                    {"time": "09:00-10:30", "topic": "Natural Language Processing"},
                    {"time": "11:00-12:30", "topic": "Robotics"}
                ]
            })
        }
        
        for key, value in conference_schedule.items():
            await self.redis_client.setex(key, 86400, value)
        
        print("✅ Redis: 创建了会话、统计、缓存、排行榜、通知队列和任务数据")
    
    async def verify_data(self):
        """验证生成的数据"""
        print("\n🔍 验证生成的数据...")
        
        # PostgreSQL验证
        if self.pg_session:
            user_count = await self.pg_session.execute(select(User))
            users = user_count.scalars().all()
            print(f"📊 PostgreSQL: {len(users)} 个用户")
        
        # Neo4j验证
        if self.neo4j_driver:
            with self.neo4j_driver.session(database=self.neo4j_database) as session:
                result = session.run("MATCH (n) RETURN count(n) as count")
                count = result.single()["count"]
                print(f"🕸️  Neo4j: {count} 个节点")
        
        # MongoDB验证
        if self.mongo_db is not None:
            papers_count = await self.mongo_db.papers.count_documents({})
            datasets_count = await self.mongo_db.datasets.count_documents({})
            experiments_count = await self.mongo_db.experiments.count_documents({})
            conferences_count = await self.mongo_db.conference_materials.count_documents({})
            cooperation_docs_count = await self.mongo_db.cooperation_documents.count_documents({})
            patents_count = await self.mongo_db.patent_documents.count_documents({})
            resource_logs_count = await self.mongo_db.resource_usage_logs.count_documents({})
            print(f"🍃 MongoDB: {papers_count} 篇论文, {datasets_count} 个数据集, {experiments_count} 个实验")
            print(f"           {conferences_count} 个会议资料, {cooperation_docs_count} 个合作文档, {patents_count} 个专利文档, {resource_logs_count} 条资源日志")
        
        # Redis验证
        if self.redis_client:
            keys = await self.redis_client.keys("*")
            print(f"🔴 Redis: {len(keys)} 个键值对")
    
    async def run(self):
        """运行完整的数据生成流程"""
        try:
            await self.connect_databases()
            
            print("\n" + "=" * 60)
            print("🚀 开始生成多数据库测试数据")
            print("=" * 60)
            
            await self.generate_postgresql_data()
            self.generate_neo4j_data()
            await self.generate_mongodb_data()
            await self.generate_redis_data()
            
            await self.verify_data()
            
            print("\n" + "=" * 60)
            print("🎉 多数据库测试数据生成完成！")
            print("=" * 60)
            
        except Exception as e:
            print(f"💥 数据生成失败: {e}")
            raise
        finally:
            await self.close_connections()


async def main():
    """主函数"""
    generator = MultiDatabaseTestDataGenerator()
    await generator.run()


if __name__ == "__main__":
    asyncio.run(main())

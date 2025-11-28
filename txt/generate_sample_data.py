"""
生成示例数据CSV文件
用于测试批量导入功能

运行方式:
    python generate_sample_data.py
    
生成位置:
    ./lists/*.csv
"""

import csv
import os
from datetime import datetime, timedelta
import random
import uuid

# 创建输出目录
OUTPUT_DIR = "lists"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 生成UUID
def gen_uuid():
    return str(uuid.uuid4())

# 生成日期
def random_date(start_date, end_date):
    time_between = end_date - start_date
    days_between = time_between.days
    random_days = random.randrange(days_between)
    return (start_date + timedelta(days=random_days)).strftime('%Y-%m-%d')

# 生成JSON格式的作者信息
def gen_authors(count=3):
    names = ["张三", "李四", "王五", "赵六", "钱七", "孙八", "周九", "吴十"]
    affiliations = ["清华大学", "北京大学", "浙江大学", "上海交通大学", "复旦大学"]
    authors = []
    for i in range(min(count, len(names))):
        authors.append({
            "name": random.choice(names),
            "affiliation": random.choice(affiliations),
            "is_corresponding": i == 0
        })
    # 使用json.dumps确保正确的JSON格式（true/false而不是True/False）
    import json
    return json.dumps(authors, ensure_ascii=False)

# 生成图片路径
def gen_image_path(category):
    images = [
        f"/uploads/images/{category}/{gen_uuid()[:8]}.jpg",
        f"/uploads/images/{category}/{gen_uuid()[:8]}.png",
        ""  # 有些记录没有图片
    ]
    return random.choice(images)

# 生成文件路径
def gen_file_path(category, ext="pdf"):
    if random.random() > 0.3:  # 70%概率有文件
        return f"/uploads/files/{category}/{gen_uuid()[:8]}.{ext}"
    return ""

# 生成相关项目JSON
def gen_related_projects():
    if random.random() > 0.5:  # 50%概率有关联项目
        import json
        return json.dumps([{
            "project_id": gen_uuid(),
            "project_name": f"关联项目{random.randint(1, 10)}"
        }], ensure_ascii=False)
    return ""

# 通用用户UUID（数据库导入时会自动处理）
SAMPLE_USER_ID = ""  # 留空，让系统自动关联当前用户

# ==================== 1. 论文数据 ====================
def generate_papers():
    papers = [
        ["title", "authors", "journal", "conference", "publish_date", "doi", "impact_factor", "citation_count", "writing_progress", "status", "abstract", "keywords", "related_projects", "image_path", "file_path"],
    ]
    
    titles = [
        "基于深度学习的图像识别算法研究",
        "机器学习在医疗诊断中的应用",
        "大数据分析技术综述",
        "云计算安全机制研究",
        "人工智能伦理问题探讨",
        "区块链技术在供应链中的应用",
        "5G网络优化策略研究",
        "物联网安全防护技术",
        "量子计算发展现状与展望",
        "边缘计算架构设计研究",
        "自然语言处理最新进展",
        "计算机视觉目标检测算法",
        "强化学习在游戏AI中的应用",
        "神经网络模型压缩技术",
        "迁移学习理论与实践",
    ]
    
    journals = ["计算机学报", "软件学报", "自动化学报", "中国科学", "计算机研究与发展", "电子学报"]
    statuses = ["draft", "submitted", "accepted", "published"]
    
    for i, title in enumerate(titles, 1):
        is_journal = random.choice([True, False])
        papers.append([
            title,
            gen_authors(random.randint(2, 4)),
            random.choice(journals) if is_journal else "",
            "" if is_journal else f"第{random.randint(1, 30)}届国际学术会议",
            random_date(datetime(2023, 1, 1), datetime(2024, 11, 15)),
            f"10.{random.randint(1000, 9999)}/{random.randint(100, 999)}",
            round(random.uniform(1.5, 8.5), 2),
            random.randint(0, 50),
            random.randint(60, 100),
            random.choice(statuses),
            f"本文研究了{title}的相关问题，提出了创新性的解决方案，通过实验验证了方法的有效性...",
            "机器学习,深度学习,人工智能,神经网络",
            gen_related_projects(),
            gen_image_path("papers"),
            gen_file_path("papers", "pdf"),
        ])
    
    filename = os.path.join(OUTPUT_DIR, "papers.csv")
    with open(filename, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f)
        writer.writerows(papers)
    print(f"✓ 生成 {filename} ({len(papers)-1} 条记录)")

# ==================== 2. 专利数据 ====================
def generate_patents():
    patents = [
        ["name", "patent_number", "application_date", "authorization_date", "patent_type", "status", "technology_field", "commercialization_value", "maintenance_deadline", "inventors", "related_projects", "image_path", "file_path"],
    ]
    
    names = [
        "一种基于AI的图像识别装置",
        "智能数据处理系统",
        "自动化测试平台",
        "分布式存储系统",
        "机器学习模型训练方法",
        "云计算资源调度系统",
        "物联网数据采集装置",
        "区块链验证方法",
        "智能推荐算法系统",
        "网络安全防护装置",
    ]
    
    patent_types = ["invention", "utility", "design"]
    statuses = ["draft", "pending", "approved", "rejected"]
    fields = ["人工智能", "大数据", "云计算", "物联网", "区块链", "网络安全"]
    
    for i, name in enumerate(names, 1):
        app_date = datetime(2024, random.randint(1, 6), random.randint(1, 28))
        auth_date = app_date + timedelta(days=random.randint(180, 730)) if random.random() > 0.5 else None
        maint_deadline = app_date + timedelta(days=random.randint(3650, 7300))
        
        patents.append([
            name,
            f"ZL202410{str(i).zfill(5)}",
            app_date.strftime('%Y-%m-%d'),
            auth_date.strftime('%Y-%m-%d') if auth_date else "",
            random.choice(patent_types),
            random.choice(statuses),
            random.choice(fields),
            random.randint(500000, 5000000),
            maint_deadline.strftime('%Y-%m-%d'),
            gen_authors(random.randint(2, 5)),
            gen_related_projects(),
            gen_image_path("patents"),
            gen_file_path("patents", "pdf"),
        ])
    
    filename = os.path.join(OUTPUT_DIR, "patents.csv")
    with open(filename, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f)
        writer.writerows(patents)
    print(f"✓ 生成 {filename} ({len(patents)-1} 条记录)")

# ==================== 3. 项目数据 ====================
def generate_projects():
    projects = [
        ["name", "project_number", "project_type", "principal", "start_date", "end_date", "budget", "budget_used", "status", "progress_percent", "priority", "risk_level", "description", "image_path"],
    ]
    
    names = [
        "智慧城市关键技术研究",
        "工业互联网平台建设",
        "大数据分析系统开发",
        "人工智能应用示范",
        "网络安全防护体系建设",
        "云计算服务平台研发",
        "物联网监测系统构建",
        "区块链应用创新研究",
        "5G通信网络优化",
        "边缘计算平台开发",
    ]
    
    principals = ["张教授", "李主任", "王博士", "刘研究员", "陈工程师"]
    project_types = ["national", "provincial", "enterprise"]
    statuses = ["planning", "ongoing", "completed", "suspended"]
    priorities = ["high", "medium", "low"]
    risk_levels = ["high", "medium", "low"]
    
    for i, name in enumerate(names, 1):
        start_date = datetime(2024, random.randint(1, 6), 1)
        end_date = start_date + timedelta(days=random.randint(365, 730))
        budget = random.randint(500, 5000) * 1000
        budget_used = budget * random.randint(20, 80) / 100
        
        projects.append([
            name,
            f"2024-{random.choice(['N', 'P', 'E'])}-{str(i).zfill(3)}",
            random.choice(project_types),
            random.choice(principals),
            start_date.strftime('%Y-%m-%d'),
            end_date.strftime('%Y-%m-%d'),
            budget,
            int(budget_used),
            random.choice(statuses),
            random.randint(20, 80),
            random.choice(priorities),
            random.choice(risk_levels),
            f"{name}的详细描述，包括研究目标、技术路线、预期成果等内容...",
            gen_image_path("projects"),
        ])
    
    filename = os.path.join(OUTPUT_DIR, "projects.csv")
    with open(filename, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f)
        writer.writerows(projects)
    print(f"✓ 生成 {filename} ({len(projects)-1} 条记录)")

# ==================== 4. 软著数据 ====================
def generate_software_copyrights():
    software = [
        ["name", "registration_number", "registration_date", "version", "status", "development_language", "category", "latest_update", "maintenance_contact", "developers", "image_path", "file_path"],
    ]
    
    names = [
        "智能数据分析系统",
        "在线学习平台软件",
        "企业资源管理系统",
        "移动办公应用",
        "智能客服系统",
        "数据可视化平台",
        "项目管理工具",
        "代码审查系统",
    ]
    
    languages = ["Python", "Java", "JavaScript", "C++", "Go"]
    categories = ["应用软件", "工具软件", "系统软件", "平台软件"]
    statuses = ["pending", "approved", "rejected"]
    
    maintainers = ["张工", "李工", "王工", "刘工"]
    
    for i, name in enumerate(names, 1):
        reg_date = datetime(2023, random.randint(1, 12), random.randint(1, 28))
        update_date = reg_date + timedelta(days=random.randint(30, 365))
        
        software.append([
            name,
            f"软著登字第{random.randint(1000000, 9999999)}号",
            reg_date.strftime('%Y-%m-%d'),
            f"v{random.randint(1, 3)}.{random.randint(0, 9)}.{random.randint(0, 9)}",
            random.choice(statuses),
            random.choice(languages),
            random.choice(categories),
            update_date.strftime('%Y-%m-%d'),
            random.choice(maintainers),
            gen_authors(random.randint(2, 4)),
            gen_image_path("software"),
            gen_file_path("software", "zip"),
        ])
    
    filename = os.path.join(OUTPUT_DIR, "software_copyrights.csv")
    with open(filename, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f)
        writer.writerows(software)
    print(f"✓ 生成 {filename} ({len(software)-1} 条记录)")

# ==================== 5. 竞赛数据 ====================
def generate_competitions():
    competitions = [
        ["name", "level", "award_level", "award_date", "registration_deadline", "submission_deadline", "progress_percent", "mentor", "team_members", "status", "image_path", "file_path"],
    ]
    
    names = [
        "全国大学生数学建模竞赛",
        "中国'互联网+'创新创业大赛",
        "ACM国际大学生程序设计竞赛",
        "全国大学生电子设计竞赛",
        "挑战杯全国大学生课外学术科技作品竞赛",
        "蓝桥杯全国软件大赛",
        "全国大学生智能汽车竞赛",
    ]
    
    levels = ["international", "national", "provincial", "school"]
    award_levels = ["金奖", "银奖", "铜奖", "优秀奖", "一等奖", "二等奖", "三等奖"]
    statuses = ["planning", "ongoing", "completed"]
    mentors = ["张老师", "李老师", "王老师", "刘老师"]
    
    for i, name in enumerate(names, 1):
        reg_deadline = datetime(2024, random.randint(1, 10), random.randint(1, 28))
        sub_deadline = reg_deadline + timedelta(days=random.randint(30, 90))
        award_date = sub_deadline + timedelta(days=random.randint(30, 60))
        
        competitions.append([
            name,
            random.choice(levels),
            random.choice(award_levels),
            award_date.strftime('%Y-%m-%d'),
            reg_deadline.strftime('%Y-%m-%d'),
            sub_deadline.strftime('%Y-%m-%d'),
            random.randint(50, 100),
            random.choice(mentors),
            gen_authors(random.randint(3, 6)),  # 团队成员
            random.choice(statuses),
            gen_image_path("competitions"),
            gen_file_path("competitions", "pdf"),
        ])
    
    filename = os.path.join(OUTPUT_DIR, "competitions.csv")
    with open(filename, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f)
        writer.writerows(competitions)
    print(f"✓ 生成 {filename} ({len(competitions)-1} 条记录)")

# ==================== 6. 会议数据 ====================
def generate_conferences():
    conferences = [
        ["name", "level", "location", "start_date", "end_date", "participation_type", "submission_status", "travel_budget", "travel_expense", "visa_required", "reminder_date", "participants", "description", "image_path", "file_path"],
    ]
    
    names = [
        "国际人工智能大会",
        "中国计算机大会",
        "世界互联网大会",
        "亚洲数据科学会议",
        "全国软件工程学术会议",
        "国际云计算技术论坛",
    ]
    
    levels = ["international", "national", "regional"]
    locations = ["北京", "上海", "深圳", "杭州", "成都", "新加坡", "东京"]
    participation_types = ["speaker", "poster", "attendee"]
    
    submission_statuses = ["pending", "accepted", "rejected", "under_review"]
    
    for i, name in enumerate(names, 1):
        start_date = datetime(2024, random.randint(1, 12), random.randint(1, 28))
        end_date = start_date + timedelta(days=random.randint(2, 5))
        reminder_date = start_date - timedelta(days=random.randint(7, 30))
        budget = random.randint(5000, 15000)
        location = random.choice(locations)
        
        conferences.append([
            name,
            random.choice(levels),
            location,
            start_date.strftime('%Y-%m-%d'),
            end_date.strftime('%Y-%m-%d'),
            random.choice(participation_types),
            random.choice(submission_statuses),
            budget,
            int(budget * random.uniform(0.8, 1.0)),
            "TRUE" if location in ["新加坡", "东京"] else "FALSE",
            reminder_date.strftime('%Y-%m-%d'),
            gen_authors(random.randint(1, 3)),  # 参会人员
            f"{name}是本领域的重要学术会议，涵盖最新研究成果和技术进展...",
            gen_image_path("conferences"),
            gen_file_path("conferences", "pdf"),
        ])
    
    filename = os.path.join(OUTPUT_DIR, "conferences.csv")
    with open(filename, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f)
        writer.writerows(conferences)
    print(f"✓ 生成 {filename} ({len(conferences)-1} 条记录)")

# ==================== 7. 合作数据 ====================
def generate_cooperations():
    cooperations = [
        ["organization", "content", "start_date", "end_date", "cooperation_type", "status", "cooperation_value", "pipeline_stage", "contact_person", "contact_email", "contact_phone", "next_follow_up", "image_path", "file_path"],
    ]
    
    organizations = [
        "华为技术有限公司",
        "腾讯科技有限公司",
        "阿里巴巴集团",
        "百度在线网络技术公司",
        "字节跳动科技有限公司",
        "中国科学院计算技术研究所",
        "清华大学",
        "北京大学",
    ]
    
    cooperation_types = ["research", "education", "industry"]
    statuses = ["negotiating", "active", "completed", "terminated"]
    contacts = ["张经理", "李主管", "王总监", "刘部长"]
    
    pipeline_stages = ["初步接触", "需求调研", "方案设计", "合同签订", "项目执行", "验收评估"]
    
    for i, org in enumerate(organizations, 1):
        start_date = datetime(2024, random.randint(1, 6), 1)
        end_date = start_date + timedelta(days=random.randint(180, 730))
        next_followup = datetime.now() + timedelta(days=random.randint(7, 30))
        
        cooperations.append([
            org,
            f"与{org}在科研项目、人才培养、技术转化等方面开展全面合作...",
            start_date.strftime('%Y-%m-%d'),
            end_date.strftime('%Y-%m-%d'),
            random.choice(cooperation_types),
            random.choice(statuses),
            random.randint(500, 5000) * 1000,
            random.choice(pipeline_stages),
            random.choice(contacts),
            f"contact{i}@example.com",
            f"138{random.randint(10000000, 99999999)}",
            next_followup.strftime('%Y-%m-%d'),
            gen_image_path("cooperations"),
            gen_file_path("cooperations", "pdf"),
        ])
    
    filename = os.path.join(OUTPUT_DIR, "cooperations.csv")
    with open(filename, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f)
        writer.writerows(cooperations)
    print(f"✓ 生成 {filename} ({len(cooperations)-1} 条记录)")

# ==================== 8. 资源数据 ====================
def generate_resources():
    resources = [
        ["name", "resource_type", "description", "version", "maintainer", "maintenance_cycle_days", "next_maintenance_date", "license", "download_count", "usage_rate", "image_path", "file_path", "external_url", "tags", "is_public"],
    ]
    
    names = [
        "ImageNet图像数据集",
        "TensorFlow深度学习框架",
        "高性能计算服务器",
        "科研文献数据库",
        "代码质量检测工具",
        "数据可视化库",
    ]
    
    resource_types = ["dataset", "tool", "equipment", "document"]
    licenses = ["MIT", "Apache 2.0", "GPL v3", "BSD", "商业授权"]
    maintainers = ["张工", "李工", "王工"]
    
    external_urls = [
        "https://github.com/example/dataset",
        "https://www.tensorflow.org/",
        "https://pytorch.org/",
        ""
    ]
    
    for i, name in enumerate(names, 1):
        maint_cycle = random.randint(30, 180)
        next_maint = datetime.now() + timedelta(days=random.randint(1, maint_cycle))
        
        resources.append([
            name,
            random.choice(resource_types),
            f"{name}的详细说明和使用指南，包含完整的技术文档和示例代码...",
            f"v{random.randint(1, 5)}.{random.randint(0, 9)}",
            random.choice(maintainers),
            maint_cycle,
            next_maint.strftime('%Y-%m-%d'),
            random.choice(licenses),
            random.randint(100, 5000),
            round(random.uniform(0.3, 0.95), 2),
            gen_image_path("resources"),
            gen_file_path("resources", random.choice(["zip", "tar.gz", "pdf"])),
            random.choice(external_urls),
            "数据集,深度学习,开源工具",
            random.choice(["TRUE", "FALSE"]),
        ])
    
    filename = os.path.join(OUTPUT_DIR, "resources.csv")
    with open(filename, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f)
        writer.writerows(resources)
    print(f"✓ 生成 {filename} ({len(resources)-1} 条记录)")

# ==================== 9. 用户数据 ====================
def generate_users():
    users = [
        ["username", "email", "password_hash", "role"],
    ]
    
    # 添加固定的示例用户
    users.append([
        "admin",
        "admin@example.com",
        "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5PJx8y.w3qLry",  # password: admin123
        "admin",
    ])
    
    usernames = ["user1", "user2", "user3", "researcher1", "student1"]
    
    for i, username in enumerate(usernames, 1):
        users.append([
            gen_uuid(),
            username,
            f"{username}@example.com",
            "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5PJx8y.w3qLry",
            "user",
        ])
    
    filename = os.path.join(OUTPUT_DIR, "users.csv")
    with open(filename, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f)
        writer.writerows(users)
    print(f"✓ 生成 {filename} ({len(users)-1} 条记录)")

# ==================== 主函数 ====================
def main():
    print("=" * 60)
    print("开始生成示例数据...")
    print("=" * 60)
    
    generate_users()
    generate_papers()
    generate_patents()
    generate_projects()
    generate_software_copyrights()
    generate_competitions()
    generate_conferences()
    generate_cooperations()
    generate_resources()
    
    print("=" * 60)
    print(f"✓ 所有文件已生成到 {OUTPUT_DIR}/ 目录")
    print("=" * 60)
    print("\n📋 生成的文件:")
    for filename in os.listdir(OUTPUT_DIR):
        filepath = os.path.join(OUTPUT_DIR, filename)
        print(f"  - {filename}")
    
    print("\n💡 使用说明:")
    print("  1. 查看生成的CSV文件")
    print("  2. 根据需要修改数据")
    print("  3. 使用系统的批量导入功能")
    print("  4. 或使用脚本直接导入到数据库")

if __name__ == "__main__":
    main()

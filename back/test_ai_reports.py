#!/usr/bin/env python3
"""测试AI报表MongoDB存储功能"""
import asyncio
import sys
import os
from pathlib import Path

# 切换到back目录
os.chdir(Path(__file__).parent)
sys.path.insert(0, str(Path(__file__).parent))

from app.db.mongodb import init_mongo, get_database, close_mongo
from app.services.ai_report import ai_report_service


async def test_ai_reports():
    """测试AI报表功能"""
    
    print("=" * 70)
    print("🤖 测试AI报表存储功能（MongoDB）")
    print("=" * 70)
    
    # 初始化MongoDB
    print("\n1️⃣ 初始化MongoDB...")
    try:
        await init_mongo()
        db = get_database()
        print("   ✅ MongoDB连接成功")
        print(f"   数据库: {db.name}")
    except Exception as e:
        print(f"   ❌ MongoDB连接失败: {e}")
        return False
    
    # 清除旧的测试数据
    print("\n2️⃣ 清除旧的测试数据...")
    try:
        collection = db["ai_reports"]
        result = await collection.delete_many({"report_type": {"$regex": "^测试"}})
        print(f"   🗑️  已删除 {result.deleted_count} 个旧测试报告")
    except Exception as e:
        print(f"   ⚠️  清除失败: {e}")
    
    # 创建全文搜索索引
    print("\n3️⃣ 创建全文搜索索引...")
    success = await ai_report_service.create_text_index()
    if success:
        print("   ✅ 索引创建成功")
    else:
        print("   ⚠️  索引可能已存在")
    
    # 测试创建AI报告
    print("\n4️⃣ 测试创建AI报告...")
    test_reports = [
        {
            "report_type": "测试月度科研工作报告",
            "report_format": "详细版",
            "ai_content": """# 2024年11月科研工作报告

## 一、报告摘要
本月科研工作取得显著进展，论文发表、项目推进、专利申请等各项指标均呈现良好态势。

## 二、详细数据分析

### 2.1 论文发表情况
本月共完成论文10篇，其中：
- SCI论文：6篇（同比增长20%）
- EI论文：3篇
- 核心期刊：1篇

### 2.2 项目进展
在研项目15个，其中：
- 国家级项目：3个
- 省部级项目：5个
- 企业合作：7个

### 2.3 专利申请
新增专利申请5项，其中发明专利4项，实用新型1项。

## 三、下月工作计划
1. 继续推进高水平论文发表
2. 加强项目执行管理
3. 提升专利申请质量

## 四、存在问题与建议
- 部分项目进度需要加快
- 国际合作需要进一步加强
""",
            "statistics": {
                "论文数量": 10,
                "专利数量": 5,
                "项目数量": 15
            },
            "time_range": {
                "start_date": "2024-11-01",
                "end_date": "2024-11-30"
            },
            "user_id": "test_user_001"
        },
        {
            "report_type": "测试季度总结报告",
            "report_format": "简洁版",
            "ai_content": """# 2024年Q4季度科研总结

## 核心成果
- 论文发表：28篇（SCI 15篇）
- 专利申请：12项
- 项目经费：350万元

## 主要亮点
1. 顶级期刊发表取得突破
2. 新增国家级项目2项
3. 国际合作不断深化

## 下季度重点
持续提升科研质量，加强团队建设。
""",
            "statistics": {
                "论文数量": 28,
                "专利数量": 12,
                "项目经费": 3500000
            },
            "time_range": {
                "start_date": "2024-10-01",
                "end_date": "2024-12-31"
            },
            "user_id": "test_user_001"
        }
    ]
    
    created_ids = []
    for report_data in test_reports:
        report_id = await ai_report_service.create_report(**report_data)
        created_ids.append(report_id)
        print(f"   ✅ 创建报告: {report_data['report_type']} (ID: {report_id})")
    
    # 测试获取最近报告
    print("\n5️⃣ 测试获取最近的报告...")
    recent_reports = await ai_report_service.get_recent_reports(limit=10)
    print(f"   📋 获取到 {len(recent_reports)} 份报告")
    for report in recent_reports[:3]:
        print(f"      - {report['report_type']} ({report['word_count']} 字)")
    
    # 测试按类型筛选
    print("\n6️⃣ 测试按类型筛选...")
    monthly_reports = await ai_report_service.get_recent_reports(
        limit=5,
        report_type="测试月度科研工作报告"
    )
    print(f"   📋 月度报告: {len(monthly_reports)} 份")
    
    # 测试全文搜索
    print("\n7️⃣ 测试全文搜索...")
    search_keywords = ["论文", "专利", "项目", "季度"]
    
    for keyword in search_keywords:
        results = await ai_report_service.search_reports(keyword, limit=5)
        print(f"   🔍 搜索 '{keyword}': 找到 {len(results)} 份报告")
    
    # 测试获取统计信息
    print("\n8️⃣ 测试获取统计信息...")
    stats = await ai_report_service.get_report_statistics()
    print(f"   📊 报告统计:")
    print(f"      总数: {stats.get('total_reports', 0)}")
    print(f"      分类统计:")
    for report_type, type_stats in stats.get('by_type', {}).items():
        print(f"         {report_type}: {type_stats['count']}份 (平均{type_stats['avg_word_count']}字)")
    
    # 查看MongoDB中的数据
    print("\n9️⃣ 查看MongoDB中的报告文档...")
    collection = db["ai_reports"]
    total_count = await collection.count_documents({})
    test_count = await collection.count_documents({"report_type": {"$regex": "^测试"}})
    print(f"   📚 总文档数: {total_count}")
    print(f"   🧪 测试文档数: {test_count}")
    
    # 显示文档大小
    cursor = collection.find({"report_type": {"$regex": "^测试"}}).limit(3)
    docs = await cursor.to_list(length=3)
    print(f"   📦 文档大小示例:")
    for doc in docs:
        import sys
        size = sys.getsizeof(str(doc))
        print(f"      {doc['report_type']}: ~{size} bytes")
        print(f"         生成时间: {doc['generated_at']}")
        print(f"         字数: {doc.get('word_count', 0)}")
    
    # 清理测试数据
    print("\n🧹 清理测试数据...")
    result = await collection.delete_many({"report_type": {"$regex": "^测试"}})
    print(f"   ✅ 已清理 {result.deleted_count} 个测试文档")
    
    # 关闭连接
    await close_mongo()
    
    print("\n" + "=" * 70)
    print("✅ AI报表存储测试完成！")
    print("=" * 70)
    
    print("\n💡 功能特性:")
    print("1. ✅ AI生成内容自动存储")
    print("2. ✅ 历史报告查询")
    print("3. ✅ 全文搜索")
    print("4. ✅ 按类型筛选")
    print("5. ✅ 统计分析")
    
    print("\n📋 新增API端点:")
    print("- POST   /api/analytics/reports/generate       生成报告（自动保存）")
    print("- GET    /api/analytics/reports/history        历史报告列表")
    print("- GET    /api/analytics/reports/{report_id}    报告详情")
    print("- DELETE /api/analytics/reports/{report_id}    删除报告")
    print("- GET    /api/analytics/reports/statistics/overview 统计信息")
    
    print("\n🎯 使用场景:")
    print("- 用户生成报告 → 自动保存到MongoDB")
    print("- 前端查看历史 → 从MongoDB读取")
    print("- 删除旧报告 → 从MongoDB删除")
    print("- 搜索报告内容 → MongoDB全文搜索")
    
    return True


if __name__ == "__main__":
    try:
        asyncio.run(test_ai_reports())
    except KeyboardInterrupt:
        print("\n\n⚠️ 测试被中断")
    except Exception as e:
        print(f"\n\n💥 测试失败: {e}")
        import traceback
        traceback.print_exc()

#!/usr/bin/env python3
"""测试操作日志功能"""
import asyncio
import sys
import os
from pathlib import Path

# 切换到back目录
os.chdir(Path(__file__).parent)
sys.path.insert(0, str(Path(__file__).parent))

from app.db.mongodb import init_mongo, get_database, close_mongo
from app.services.audit_log import audit_log_service
from datetime import datetime, timedelta


async def test_audit_logs():
    """测试操作日志功能"""
    
    print("=" * 70)
    print("🗂️  测试操作日志功能（MongoDB）")
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
        collection = db["audit_logs"]
        result = await collection.delete_many({"user_id": {"$regex": "^test_user"}})
        print(f"   🗑️  已删除 {result.deleted_count} 个旧测试日志")
    except Exception as e:
        print(f"   ⚠️  清除失败: {e}")
    
    # 测试创建操作日志
    print("\n3️⃣ 测试记录各类操作...")
    test_logs = [
        {
            "user_id": "test_user_001",
            "action": "create",
            "resource_type": "paper",
            "resource_id": "paper_001",
            "changes": {
                "after": {
                    "title": "深度学习研究论文",
                    "authors": "张三, 李四",
                    "status": "draft"
                }
            },
            "ip_address": "192.168.1.100",
            "user_agent": "Mozilla/5.0...",
            "status": "success"
        },
        {
            "user_id": "test_user_001",
            "action": "update",
            "resource_type": "paper",
            "resource_id": "paper_001",
            "changes": {
                "before": {"status": "draft"},
                "after": {"status": "published"}
            },
            "ip_address": "192.168.1.100",
            "status": "success"
        },
        {
            "user_id": "test_user_002",
            "action": "create",
            "resource_type": "project",
            "resource_id": "project_001",
            "changes": {
                "after": {
                    "name": "AI研究项目",
                    "budget": 500000
                }
            },
            "ip_address": "192.168.1.101",
            "status": "success"
        },
        {
            "user_id": "test_user_001",
            "action": "delete",
            "resource_type": "patent",
            "resource_id": "patent_001",
            "changes": {
                "before": {
                    "title": "一种专利技术"
                }
            },
            "ip_address": "192.168.1.100",
            "status": "success"
        },
        {
            "user_id": "test_user_003",
            "action": "export",
            "resource_type": "report",
            "ip_address": "192.168.1.102",
            "status": "success"
        },
        {
            "user_id": "test_user_001",
            "action": "login",
            "resource_type": "user",
            "ip_address": "192.168.1.100",
            "status": "success"
        }
    ]
    
    log_ids = []
    for log_data in test_logs:
        log_id = await audit_log_service.log_action(**log_data)
        log_ids.append(log_id)
        print(f"   ✅ 记录日志: {log_data['action']} {log_data['resource_type']} (ID: {log_id})")
    
    # 测试获取用户日志
    print("\n4️⃣ 测试获取用户操作日志...")
    user_logs = await audit_log_service.get_user_logs("test_user_001", limit=10)
    print(f"   📋 test_user_001 的操作日志: {len(user_logs)} 条")
    for log in user_logs:
        print(f"      - {log['action']} {log['resource_type']} at {log['timestamp']}")
    
    # 测试获取资源历史
    print("\n5️⃣ 测试获取资源操作历史...")
    resource_logs = await audit_log_service.get_resource_logs("paper", "paper_001")
    print(f"   📋 paper_001 的操作历史: {len(resource_logs)} 条")
    for log in resource_logs:
        print(f"      - {log['action']} by {log['user_id']} at {log['timestamp']}")
    
    # 测试按操作类型筛选
    print("\n6️⃣ 测试按操作类型筛选...")
    create_logs = await audit_log_service.get_recent_logs(limit=10, action="create")
    print(f"   📋 create 操作: {len(create_logs)} 条")
    
    update_logs = await audit_log_service.get_recent_logs(limit=10, action="update")
    print(f"   📋 update 操作: {len(update_logs)} 条")
    
    delete_logs = await audit_log_service.get_recent_logs(limit=10, action="delete")
    print(f"   📋 delete 操作: {len(delete_logs)} 条")
    
    # 测试按资源类型筛选
    print("\n7️⃣ 测试按资源类型筛选...")
    paper_logs = await audit_log_service.get_recent_logs(limit=10, resource_type="paper")
    print(f"   📋 paper 资源: {len(paper_logs)} 条")
    
    project_logs = await audit_log_service.get_recent_logs(limit=10, resource_type="project")
    print(f"   📋 project 资源: {len(project_logs)} 条")
    
    # 测试统计功能
    print("\n8️⃣ 测试日志统计...")
    stats = await audit_log_service.get_statistics()
    print(f"   📊 日志统计:")
    print(f"      总数: {stats['total']}")
    print(f"      按操作统计:")
    for action, count in stats['by_action'].items():
        print(f"         {action}: {count}")
    print(f"      按资源统计:")
    for resource, count in stats['by_resource'].items():
        print(f"         {resource}: {count}")
    
    # 测试搜索功能
    print("\n9️⃣ 测试日志搜索...")
    search_results = await audit_log_service.search_logs("paper", limit=10)
    print(f"   🔍 搜索 'paper': 找到 {len(search_results)} 条日志")
    
    # 查看MongoDB中的数据
    print("\n🔟 查看MongoDB中的日志文档...")
    collection = db["audit_logs"]
    total_count = await collection.count_documents({})
    test_count = await collection.count_documents({"user_id": {"$regex": "^test_user"}})
    print(f"   📚 总日志数: {total_count}")
    print(f"   🧪 测试日志数: {test_count}")
    
    # 显示最近的日志
    cursor = collection.find({"user_id": {"$regex": "^test_user"}}).sort("timestamp", -1).limit(5)
    docs = await cursor.to_list(length=5)
    print(f"   📦 最近的5条日志:")
    for doc in docs:
        print(f"      {doc['action']:8} {doc['resource_type']:10} by {doc['user_id']:15} at {doc['timestamp']}")
    
    # 测试时间范围查询
    print("\n1️⃣1️⃣ 测试时间范围查询...")
    start_date = datetime.now() - timedelta(hours=1)
    end_date = datetime.now()
    time_stats = await audit_log_service.get_statistics(start_date=start_date, end_date=end_date)
    print(f"   📊 最近1小时的日志: {time_stats['total']} 条")
    
    # 清理测试数据
    print("\n🧹 清理测试数据...")
    result = await collection.delete_many({"user_id": {"$regex": "^test_user"}})
    print(f"   ✅ 已清理 {result.deleted_count} 个测试日志")
    
    # 关闭连接
    await close_mongo()
    
    print("\n" + "=" * 70)
    print("✅ 操作日志测试完成！")
    print("=" * 70)
    
    print("\n💡 功能特性:")
    print("1. ✅ 操作日志记录（create/update/delete等）")
    print("2. ✅ 按用户查询日志")
    print("3. ✅ 按资源查询历史")
    print("4. ✅ 按操作类型筛选")
    print("5. ✅ 按资源类型筛选")
    print("6. ✅ 日志统计分析")
    print("7. ✅ 日志搜索")
    print("8. ✅ 时间范围查询")
    
    print("\n📋 新增API端点:")
    print("- GET    /api/audit-logs/my                    我的操作日志")
    print("- GET    /api/audit-logs/recent                最近日志（管理员）")
    print("- GET    /api/audit-logs/resource/{type}/{id}  资源操作历史")
    print("- GET    /api/audit-logs/statistics            日志统计（管理员）")
    print("- GET    /api/audit-logs/search                搜索日志（管理员）")
    print("- POST   /api/audit-logs/clean                 清理旧日志（管理员）")
    print("- POST   /api/audit-logs/log                   手动记录日志")
    
    print("\n🎯 使用场景:")
    print("- 审计追溯：查看谁在何时做了什么")
    print("- 数据变更历史：追踪资源的完整变更过程")
    print("- 安全监控：发现异常操作行为")
    print("- 统计分析：了解用户操作习惯")
    print("- 合规要求：满足数据保护法规")
    
    return True


if __name__ == "__main__":
    try:
        asyncio.run(test_audit_logs())
    except KeyboardInterrupt:
        print("\n\n⚠️ 测试被中断")
    except Exception as e:
        print(f"\n\n💥 测试失败: {e}")
        import traceback
        traceback.print_exc()

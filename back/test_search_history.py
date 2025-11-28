#!/usr/bin/env python3
"""测试搜索历史功能"""
import asyncio
import sys
import os
from pathlib import Path

# 切换到back目录
os.chdir(Path(__file__).parent)
sys.path.insert(0, str(Path(__file__).parent))

from app.db.redis import init_redis, get_client, close_redis
from app.services.search_history import search_history_service


async def test_search_history():
    """测试搜索历史功能"""
    
    print("=" * 70)
    print("🔍 测试搜索历史功能")
    print("=" * 70)
    
    # 初始化Redis
    print("\n1️⃣ 初始化Redis...")
    try:
        await init_redis()
        redis_client = get_client()
        print("   ✅ Redis连接成功")
    except Exception as e:
        print(f"   ❌ Redis连接失败: {e}")
        return False
    
    # 测试用户ID
    test_user_id = "test_user_123"
    
    # 清除旧数据
    print("\n2️⃣ 清除旧的测试数据...")
    await search_history_service.clear_user_history(test_user_id)
    await redis_client.delete("search:hot:global")
    await redis_client.delete("search:hot:global:papers")
    print("   ✅ 旧数据已清除")
    
    # 测试记录搜索
    print("\n3️⃣ 测试记录搜索历史...")
    test_keywords = [
        ("深度学习", "papers"),
        ("机器学习", "papers"),
        ("深度学习", None),  # 重复搜索，增加热度
        ("神经网络", "papers"),
        ("区块链", "projects"),
        ("深度学习", "papers"),  # 再次搜索，进一步增加热度
        ("自然语言处理", "papers"),
        ("计算机视觉", "papers"),
    ]
    
    for keyword, category in test_keywords:
        success = await search_history_service.record_search(
            user_id=test_user_id,
            keyword=keyword,
            category=category
        )
        if success:
            print(f"   ✅ 记录搜索: {keyword} (分类: {category or '全部'})")
        else:
            print(f"   ❌ 记录失败: {keyword}")
    
    # 测试获取用户历史
    print("\n4️⃣ 测试获取用户搜索历史...")
    history = await search_history_service.get_user_history(test_user_id, limit=10)
    print(f"   📋 搜索历史 (最近{len(history)}条):")
    for i, kw in enumerate(history, 1):
        print(f"      {i}. {kw}")
    
    # 测试获取全局热词
    print("\n5️⃣ 测试获取全局热门关键词...")
    hot_keywords = await search_history_service.get_hot_keywords(limit=10)
    print(f"   🔥 全局热词 (Top {len(hot_keywords)}):")
    for i, (kw, count) in enumerate(hot_keywords, 1):
        print(f"      {i}. {kw} - {count}次")
    
    # 测试获取分类热词
    print("\n6️⃣ 测试获取分类热门关键词 (papers)...")
    papers_hot = await search_history_service.get_hot_keywords(limit=5, category="papers")
    print(f"   📚 论文热词 (Top {len(papers_hot)}):")
    for i, (kw, count) in enumerate(papers_hot, 1):
        print(f"      {i}. {kw} - {count}次")
    
    # 测试搜索建议
    print("\n7️⃣ 测试搜索建议...")
    test_prefixes = ["深", "机", "自"]
    for prefix in test_prefixes:
        suggestions = await search_history_service.get_search_suggestions(prefix, limit=5)
        if suggestions:
            print(f"   💡 '{prefix}' 的建议: {', '.join(suggestions)}")
        else:
            print(f"   💡 '{prefix}' 无匹配建议")
    
    # 检查Redis中的键
    print("\n8️⃣ 检查Redis中的搜索相关键...")
    search_keys = await redis_client.keys("search:*")
    print(f"   🔑 搜索相关键数: {len(search_keys)}")
    for key in search_keys:
        key_type = await redis_client.type(key)
        if key_type == "list":
            size = await redis_client.llen(key)
            print(f"      {key} (list, {size} 项)")
        elif key_type == "zset":
            size = await redis_client.zcard(key)
            print(f"      {key} (zset, {size} 项)")
        else:
            print(f"      {key} ({key_type})")
    
    # 测试清除历史
    print("\n9️⃣ 测试清除用户搜索历史...")
    success = await search_history_service.clear_user_history(test_user_id)
    print(f"   {'✅ 清除成功' if success else '❌ 清除失败'}")
    
    # 验证清除
    history_after = await search_history_service.get_user_history(test_user_id)
    print(f"   📋 清除后的历史数: {len(history_after)}")
    
    # 关闭连接
    await close_redis()
    
    print("\n" + "=" * 70)
    print("✅ 搜索历史功能测试完成！")
    print("=" * 70)
    
    print("\n💡 使用说明:")
    print("1. 用户每次搜索时自动记录到Redis")
    print("2. 可通过 GET /api/search/history/my 获取历史")
    print("3. 可通过 GET /api/search/hot-keywords 获取热词")
    print("4. 可通过 GET /api/search/suggestions?q=关键词 获取建议")
    print("5. 可通过 DELETE /api/search/history/my 清除历史")
    
    return True


if __name__ == "__main__":
    try:
        asyncio.run(test_search_history())
    except KeyboardInterrupt:
        print("\n\n⚠️ 测试被中断")
    except Exception as e:
        print(f"\n\n💥 测试失败: {e}")
        import traceback
        traceback.print_exc()

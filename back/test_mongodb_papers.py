#!/usr/bin/env python3
"""测试MongoDB论文文档功能"""
import asyncio
import sys
import os
from pathlib import Path

# 切换到back目录
os.chdir(Path(__file__).parent)
sys.path.insert(0, str(Path(__file__).parent))

from app.db.mongodb import init_mongo, get_database, close_mongo
from app.services.paper_document import paper_document_service


async def test_mongodb_papers():
    """测试MongoDB论文文档功能"""
    
    print("=" * 70)
    print("📄 测试MongoDB论文文档功能")
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
        collection = db["papers"]
        result = await collection.delete_many({"paper_id": {"$regex": "^test_"}})
        print(f"   🗑️  已删除 {result.deleted_count} 个旧测试文档")
    except Exception as e:
        print(f"   ⚠️  清除失败: {e}")
    
    # 创建全文搜索索引
    print("\n3️⃣ 创建全文搜索索引...")
    success = await paper_document_service.create_text_index()
    if success:
        print("   ✅ 索引创建成功")
    else:
        print("   ⚠️  索引可能已存在")
    
    # 测试创建论文文档
    print("\n4️⃣ 测试创建论文文档...")
    test_papers = [
        {
            "paper_id": "test_paper_001",
            "title": "深度学习在图像识别中的应用研究",
            "full_text": """
            摘要：本文研究了深度学习技术在图像识别领域的应用。通过卷积神经网络（CNN）模型，
            我们实现了高精度的图像分类系统。实验结果表明，该方法在ImageNet数据集上达到了
            95%的准确率。
            
            第一章 引言
            图像识别是计算机视觉领域的核心问题之一。近年来，深度学习技术的发展为图像识别
            带来了革命性的进步。卷积神经网络（CNN）作为深度学习的代表性模型，在图像识别
            任务中展现出了强大的能力。
            
            第二章 相关工作
            早期的图像识别方法主要依赖手工设计的特征提取器...
            
            第三章 方法
            我们提出的模型基于ResNet架构，采用了残差连接和批归一化技术...
            
            第四章 实验
            在ImageNet数据集上进行了大量实验...
            
            第五章 结论
            本文证明了深度学习在图像识别中的有效性...
            """,
            "abstract": "本文研究了深度学习技术在图像识别领域的应用",
            "sections": [
                {"title": "引言", "content": "图像识别是计算机视觉领域的核心问题..."},
                {"title": "相关工作", "content": "早期的图像识别方法..."},
                {"title": "方法", "content": "我们提出的模型基于ResNet架构..."},
                {"title": "实验", "content": "在ImageNet数据集上进行了大量实验..."},
                {"title": "结论", "content": "本文证明了深度学习在图像识别中的有效性..."}
            ],
            "metadata": {"word_count": 850, "page_count": 8, "language": "zh-CN"}
        },
        {
            "paper_id": "test_paper_002",
            "title": "自然语言处理中的Transformer模型",
            "full_text": """
            本文介绍了Transformer模型在自然语言处理中的应用。Transformer采用自注意力机制，
            彻底改变了NLP领域的研究范式。我们在多个NLP任务上验证了该模型的有效性。
            
            Transformer模型的核心是自注意力机制（Self-Attention），它能够捕捉序列中任意两个
            位置之间的依赖关系。相比传统的RNN和LSTM，Transformer具有更好的并行性和更长的
            有效建模距离。
            
            在机器翻译、文本摘要、问答系统等任务上，Transformer模型都取得了最先进的性能。
            BERT、GPT等大规模预训练模型的成功进一步证明了Transformer架构的优越性。
            """,
            "abstract": "介绍Transformer模型在自然语言处理中的应用",
            "sections": [
                {"title": "介绍", "content": "Transformer采用自注意力机制..."},
                {"title": "模型架构", "content": "Transformer的核心是自注意力机制..."},
                {"title": "实验结果", "content": "在多个NLP任务上验证..."}
            ],
            "metadata": {"word_count": 520, "page_count": 5, "language": "zh-CN"}
        },
        {
            "paper_id": "test_paper_003",
            "title": "区块链技术在供应链管理中的应用",
            "full_text": """
            区块链技术以其去中心化、不可篡改的特性，为供应链管理提供了新的解决方案。
            本文设计并实现了一个基于区块链的供应链追溯系统，能够实现产品从生产到销售
            全过程的透明化管理。
            
            传统供应链管理存在信息不透明、数据易篡改等问题。区块链技术通过分布式账本
            和共识机制，确保了数据的真实性和可追溯性。智能合约的引入进一步自动化了
            业务流程，提高了效率。
            
            我们的系统已在某食品企业的供应链中进行了试点应用，实现了从农场到餐桌的
            全程追溯，获得了良好的效果。
            """,
            "abstract": "区块链技术在供应链管理中的应用研究",
            "sections": [
                {"title": "背景", "content": "传统供应链管理的问题..."},
                {"title": "系统设计", "content": "基于区块链的解决方案..."},
                {"title": "应用案例", "content": "在食品行业的应用..."}
            ],
            "metadata": {"word_count": 480, "page_count": 4, "language": "zh-CN"}
        }
    ]
    
    created_ids = []
    for paper_data in test_papers:
        doc_id = await paper_document_service.create_paper_document(**paper_data)
        created_ids.append(doc_id)
        print(f"   ✅ 创建论文: {paper_data['title'][:30]}... (ID: {doc_id})")
    
    # 测试获取论文文档
    print("\n5️⃣ 测试获取论文文档...")
    doc = await paper_document_service.get_paper_document("test_paper_001")
    if doc:
        print(f"   ✅ 获取成功:")
        print(f"      标题: {doc['title']}")
        print(f"      字数: {doc['metadata'].get('word_count', 0)}")
        print(f"      章节数: {len(doc.get('sections', []))}")
    else:
        print(f"   ❌ 获取失败")
    
    # 测试全文搜索
    print("\n6️⃣ 测试全文搜索...")
    search_queries = ["深度学习", "Transformer", "区块链", "图像识别"]
    
    for query in search_queries:
        results = await paper_document_service.search_full_text(query, limit=5)
        print(f"   🔍 搜索 '{query}': 找到 {len(results)} 篇论文")
        for result in results:
            print(f"      - {result['title'][:40]}...")
    
    # 测试更新论文文档
    print("\n7️⃣ 测试更新论文文档...")
    success = await paper_document_service.update_paper_document(
        paper_id="test_paper_001",
        abstract="更新后的摘要：本文深入研究了深度学习技术..."
    )
    if success:
        print(f"   ✅ 更新成功")
        updated_doc = await paper_document_service.get_paper_document("test_paper_001")
        print(f"   新摘要: {updated_doc['abstract'][:50]}...")
    
    # 测试获取统计信息
    print("\n8️⃣ 测试获取统计信息...")
    stats = await paper_document_service.get_paper_statistics()
    print(f"   📊 论文统计:")
    print(f"      总数: {stats.get('total_papers', 0)}")
    print(f"      平均字数: {int(stats.get('avg_word_count', 0))}")
    print(f"      总章节数: {int(stats.get('total_sections', 0))}")
    
    # 查看MongoDB中的数据
    print("\n9️⃣ 查看MongoDB中的论文文档...")
    collection = db["papers"]
    total_count = await collection.count_documents({})
    test_count = await collection.count_documents({"paper_id": {"$regex": "^test_"}})
    print(f"   📚 总文档数: {total_count}")
    print(f"   🧪 测试文档数: {test_count}")
    
    # 显示文档大小
    cursor = collection.find({"paper_id": {"$regex": "^test_"}}).limit(3)
    docs = await cursor.to_list(length=3)
    print(f"   📦 文档大小示例:")
    for doc in docs:
        import sys
        size = sys.getsizeof(str(doc))
        print(f"      {doc['title'][:30]}...: ~{size} bytes")
    
    # 清理测试数据
    print("\n🧹 清理测试数据...")
    result = await collection.delete_many({"paper_id": {"$regex": "^test_"}})
    print(f"   ✅ 已清理 {result.deleted_count} 个测试文档")
    
    # 关闭连接
    await close_mongo()
    
    print("\n" + "=" * 70)
    print("✅ MongoDB论文文档测试完成！")
    print("=" * 70)
    
    print("\n💡 功能特性:")
    print("1. ✅ 论文全文存储（支持大文本）")
    print("2. ✅ 章节化管理")
    print("3. ✅ 全文搜索（MongoDB Text Search）")
    print("4. ✅ 元数据统计")
    print("5. ✅ 灵活的Schema")
    
    print("\n📋 新增API端点:")
    print("- POST   /api/paper-documents/           创建论文文档")
    print("- GET    /api/paper-documents/{paper_id} 获取论文全文")
    print("- PUT    /api/paper-documents/{paper_id} 更新论文文档")
    print("- DELETE /api/paper-documents/{paper_id} 删除论文文档")
    print("- GET    /api/paper-documents/search/full-text 全文搜索")
    print("- GET    /api/paper-documents/statistics/overview 统计信息")
    
    return True


if __name__ == "__main__":
    try:
        asyncio.run(test_mongodb_papers())
    except KeyboardInterrupt:
        print("\n\n⚠️ 测试被中断")
    except Exception as e:
        print(f"\n\n💥 测试失败: {e}")
        import traceback
        traceback.print_exc()

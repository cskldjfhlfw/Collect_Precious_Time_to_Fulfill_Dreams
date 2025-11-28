"""
测试搜索功能修复
验证NULL值处理是否正确
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.crud.software_copyrights import crud_software_copyright
from app.crud.papers import crud_paper
from app.crud.projects import crud_project
from app.crud.resources import crud_resource
from app.crud.patents import crud_patent
from app.crud.competitions import crud_competition
from app.crud.conferences import crud_conference
from app.crud.cooperations import crud_cooperation

# 数据库连接配置（请根据实际情况修改）
DATABASE_URL = "postgresql+asyncpg://user:password@localhost/dbname"


async def test_search_with_null_handling():
    """测试搜索功能对NULL值的处理"""
    engine = create_async_engine(DATABASE_URL, echo=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        print("=" * 60)
        print("测试搜索功能 - NULL值处理")
        print("=" * 60)
        
        # 测试用例：搜索单个字符 'a'
        test_queries = ["a", "test", "人工智能", ""]
        
        for query in test_queries:
            print(f"\n搜索关键词: '{query}'")
            print("-" * 60)
            
            try:
                # 测试软著搜索
                print("  [软著] 搜索中...")
                sc_results = await crud_software_copyright.search(session, query=query, limit=5)
                print(f"  [软著] 找到 {len(sc_results)} 条结果")
                
                # 测试论文搜索
                print("  [论文] 搜索中...")
                paper_results = await crud_paper.search(session, query=query, limit=5)
                print(f"  [论文] 找到 {len(paper_results)} 条结果")
                
                # 测试项目搜索
                print("  [项目] 搜索中...")
                project_results = await crud_project.search(session, query=query, limit=5)
                print(f"  [项目] 找到 {len(project_results)} 条结果")
                
                # 测试资源搜索
                print("  [资源] 搜索中...")
                resource_results = await crud_resource.search(session, query=query, limit=5)
                print(f"  [资源] 找到 {len(resource_results)} 条结果")
                
                # 测试专利搜索
                print("  [专利] 搜索中...")
                patent_results = await crud_patent.search(session, query=query, limit=5)
                print(f"  [专利] 找到 {len(patent_results)} 条结果")
                
                # 测试比赛搜索
                print("  [比赛] 搜索中...")
                competition_results = await crud_competition.search(session, query=query, limit=5)
                print(f"  [比赛] 找到 {len(competition_results)} 条结果")
                
                # 测试会议搜索
                print("  [会议] 搜索中...")
                conference_results = await crud_conference.search(session, query=query, limit=5)
                print(f"  [会议] 找到 {len(conference_results)} 条结果")
                
                # 测试合作搜索
                print("  [合作] 搜索中...")
                cooperation_results = await crud_cooperation.search(session, query=query, limit=5)
                print(f"  [合作] 找到 {len(cooperation_results)} 条结果")
                
                print(f"  ✓ 搜索 '{query}' 成功完成")
                
            except Exception as e:
                print(f"  ✗ 搜索 '{query}' 失败: {str(e)}")
                import traceback
                traceback.print_exc()
        
        print("\n" + "=" * 60)
        print("测试完成")
        print("=" * 60)


if __name__ == "__main__":
    print("开始测试搜索功能修复...")
    print("注意: 请先在脚本中配置正确的数据库连接信息")
    print()
    
    # asyncio.run(test_search_with_null_handling())
    print("请取消注释上面的代码行并配置DATABASE_URL后运行测试")

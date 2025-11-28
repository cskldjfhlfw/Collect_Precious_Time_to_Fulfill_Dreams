import asyncio
import sys
sys.path.insert(0, 'back')

from sqlalchemy import select
from app.db.postgres import async_session_maker
from app.models.tables import Competition

async def test_competitions():
    print("=" * 60)
    print("测试数据库中的赛事数据")
    print("=" * 60)
    
    async with async_session_maker() as db:
        # 查询总数
        result = await db.execute(select(Competition))
        competitions = result.scalars().all()
        
        print(f"\n数据库中的赛事总数: {len(competitions)}")
        
        if competitions:
            print(f"\n前3条记录:")
            for i, comp in enumerate(competitions[:3], 1):
                print(f"\n{i}. {comp.name}")
                print(f"   ID: {comp.id}")
                print(f"   状态: {comp.status}")
                print(f"   级别: {comp.level}")
                print(f"   导师: {comp.mentor}")
                print(f"   进度: {comp.progress_percent}%")
                print(f"   团队成员: {comp.team_members}")
                print(f"   创建时间: {comp.created_at}")
        else:
            print("\n数据库中没有赛事数据！")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    asyncio.run(test_competitions())

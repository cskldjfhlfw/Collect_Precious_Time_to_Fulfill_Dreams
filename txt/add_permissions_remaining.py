"""
快速为剩余4个API文件添加权限验证的辅助脚本
需要手动为以下文件的POST/PUT/DELETE方法添加这行参数：
current_user: Annotated[User, Depends(get_current_admin_user)],

文件列表：
1. back/app/api/routes/competitions.py
2. back/app/api/routes/conferences.py
3. back/app/api/routes/cooperations.py
4. back/app/api/routes/resources.py

在每个 @router.post / @router.put / @router.delete 的函数中，
在第一个参数后添加：
    current_user: Annotated[User, Depends(get_current_admin_user)],

然后把 db: AsyncSession = Depends(get_session) 放到最后
"""

files_to_fix = [
    "back/app/api/routes/competitions.py",
    "back/app/api/routes/conferences.py", 
    "back/app/api/routes/cooperations.py",
    "back/app/api/routes/resources.py"
]

print("需要手动修改的文件：")
for f in files_to_fix:
    print(f"  - {f}")

print("\n修改模板：")
print("""
# 修改前：
@router.post("/")
async def create_xxx(
    xxx_in: XxxCreate,
    db: AsyncSession = Depends(get_session),
) -> Any:

# 修改后：
@router.post("/")
async def create_xxx(
    xxx_in: XxxCreate,
    current_user: Annotated[User, Depends(get_current_admin_user)],  # ← 添加这行
    db: AsyncSession = Depends(get_session),
) -> Any:
""")

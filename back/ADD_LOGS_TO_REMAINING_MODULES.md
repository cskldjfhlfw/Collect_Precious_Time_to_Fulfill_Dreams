# 为剩余模块添加日志记录指南

## 已完成的模块 ✅
1. Papers（论文）
2. Projects（项目）
3. Patents（专利）
4. Users（用户）
5. Software Copyrights（软著）

## 待添加的模块 ⏸

### 1. Conferences（会议）
**文件**: `app/api/routes/conferences.py`

**需要修改的端点**:
- `create_conference` - 创建会议
- `update_conference` - 更新会议
- `delete_conference` - 删除会议

**关键字段**: `name`, `participation_type`

**示例代码**:
```python
# 1. 添加导入
from fastapi import Request
from app.services.audit_log import audit_log_service

# 2. 在函数参数中添加request: Request

# 3. 记录日志
await audit_log_service.log_action(
    user_id=str(current_user.id),
    action="create",  # or "update", "delete"
    resource_type="conference",
    resource_id=str(conference.id),
    changes={"after": {"name": conference.name, "participation_type": conference.participation_type}},
    ip_address=request.client.host if request.client else None,
    user_agent=request.headers.get("user-agent"),
    status="success"
)
```

---

### 2. Cooperations（合作）
**文件**: `app/api/routes/cooperations.py`

**需要修改的端点**:
- `create_cooperation` - 创建合作
- `update_cooperation` - 更新合作
- `delete_cooperation` - 删除合作

**关键字段**: `organization`, `cooperation_type`

**示例代码**:
```python
await audit_log_service.log_action(
    user_id=str(current_user.id),
    action="create",
    resource_type="cooperation",
    resource_id=str(cooperation.id),
    changes={"after": {"organization": cooperation.organization, "cooperation_type": cooperation.cooperation_type}},
    ip_address=request.client.host if request.client else None,
    user_agent=request.headers.get("user-agent"),
    status="success"
)
```

---

### 3. Competitions（竞赛）
**文件**: `app/api/routes/competitions.py`

**需要修改的端点**:
- `create_competition` - 创建竞赛
- `update_competition` - 更新竞赛
- `delete_competition` - 删除竞赛

**关键字段**: `name`, `level`

**示例代码**:
```python
await audit_log_service.log_action(
    user_id=str(current_user.id),
    action="create",
    resource_type="competition",
    resource_id=str(competition.id),
    changes={"after": {"name": competition.name, "level": competition.level}},
    ip_address=request.client.host if request.client else None,
    user_agent=request.headers.get("user-agent"),
    status="success"
)
```

---

### 4. Resources（资源） - 可选
**文件**: `app/api/routes/resources.py`

**需要修改的端点**:
- `create_resource` - 创建资源
- `update_resource` - 更新资源  
- `delete_resource` - 删除资源

**关键字段**: `name`, `resource_type`

---

## 通用添加步骤

### 第1步：添加导入
```python
from fastapi import Request
from app.services.audit_log import audit_log_service
```

### 第2步：在函数签名中添加request
```python
@router.post("/")
async def create_xxx(
    xxx_in: XxxCreate,
    request: Request,  # ← 添加这个
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_session),
):
```

### 第3步：包裹在try-except中
```python
try:
    # 原有的创建/更新/删除逻辑
    obj = await crud.create(db, obj_in)
    
    # 记录成功日志
    await audit_log_service.log_action(
        user_id=str(current_user.id),
        action="create",
        resource_type="xxx",
        resource_id=str(obj.id),
        changes={"after": {"name": obj.name}},
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        status="success"
    )
    
    return obj
    
except Exception as e:
    # 记录失败日志
    await audit_log_service.log_action(
        user_id=str(current_user.id),
        action="create",
        resource_type="xxx",
        status="failed",
        error_message=str(e),
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    raise
```

---

## 注意事项

### 1. 字段名检查
不同模块的字段名可能不同，需要检查数据库模型：
- Papers: `title`
- Patents: `name`
- Projects: `name`
- Users: `username`, `email`

### 2. 更新操作记录before/after
```python
# 保存更新前数据
old_data = {"name": obj.name, "status": obj.status}

# 更新
updated_obj = await crud.update(db, db_obj=obj, obj_in=update_data)

# 记录变更
changes={
    "before": old_data,
    "after": {"name": updated_obj.name, "status": updated_obj.status}
}
```

### 3. 删除操作先获取数据
```python
# 先获取数据
obj_to_delete = await crud.get(db, obj_id)

# 保存删除前数据
deleted_data = {"name": obj_to_delete.name}

# 删除
await crud.remove(db, id=obj_id)

# 记录
changes={"before": deleted_data}
```

---

## 测试方法

1. 创建一条记录
2. 修改这条记录
3. 删除这条记录
4. 访问 `/admin/logs` 查看日志
5. 确认日志中包含正确的操作类型和数据变更

---

## 优先级

**高优先级**（核心业务）:
- ✅ Papers
- ✅ Projects  
- ✅ Patents
- ✅ Users

**中优先级**（常用功能）:
- ✅ Software Copyrights
- ⏸ Conferences
- ⏸ Cooperations
- ⏸ Competitions

**低优先级**（辅助功能）:
- ⏸ Resources

---

## 当前覆盖率

**5/8 模块已集成日志记录（62.5%）**

核心模块已全部覆盖，系统的主要操作都会被记录！

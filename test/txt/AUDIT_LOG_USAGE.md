# 操作日志使用指南

## ✅ 已集成日志记录的模块

### 1. Papers API
**文件**: `app/api/routes/papers.py`
- ✅ 创建论文 (`POST /api/papers/`)
- ✅ 更新论文 (`PUT /api/papers/{paper_id}`)
- ✅ 删除论文 (`DELETE /api/papers/{paper_id}`)

### 2. Projects API
**文件**: `app/api/routes/projects.py`
- ✅ 创建项目 (`POST /api/projects/`)
- ✅ 更新项目 (`PUT /api/projects/{project_id}`)
- ✅ 删除项目 (`DELETE /api/projects/{project_id}`)

### 3. Patents API
**文件**: `app/api/routes/patents.py`
- ✅ 创建专利 (`POST /api/patents/`)
- ✅ 更新专利 (`PUT /api/patents/{patent_id}`)
- ✅ 删除专利 (`DELETE /api/patents/{patent_id}`)

### 4. Users API（用户管理 - 非常重要！）
**文件**: `app/api/routes/users.py`
- ✅ 更新用户 (`PATCH /api/users/{user_id}`) - 记录用户名、邮箱、角色变更
- ✅ 删除用户 (`DELETE /api/users/{user_id}`) - 记录被删除用户信息
- ✅ 重置密码 (`POST /api/users/{user_id}/reset-password`) - 记录密码重置操作（不记录密码内容）

### 4.5. Authentication API（认证 - 安全关键！）
**文件**: `app/api/routes/auth.py`
- ✅ 用户注册 (`POST /auth/register`) - 记录新用户注册，包含IP和user-agent
- ✅ 用户登录 (`POST /auth/login`) - 记录登录操作，包含IP和user-agent
- ✅ 验证码登录 (`POST /auth/login-with-code`) - 记录验证码登录方式
- ✅ 验证码注册 (`POST /auth/register-with-code`) - 记录验证码注册方式

### 5. Software Copyrights API（软著）
**文件**: `app/api/routes/software_copyrights.py`
- ✅ 创建软著 (`POST /api/software-copyrights/`)
- ✅ 更新软著 (`PUT /api/software-copyrights/{software_copyright_id}`)
- ✅ 删除软著 (`DELETE /api/software-copyrights/{software_copyright_id}`)

### 6. Conferences API（会议）
**文件**: `app/api/routes/conferences.py`
- ✅ 创建会议 (`POST /api/conferences/`)
- ✅ 更新会议 (`PUT /api/conferences/{conference_id}`)
- ✅ 删除会议 (`DELETE /api/conferences/{conference_id}`)

### 7. Cooperations API（合作）
**文件**: `app/api/routes/cooperations.py`
- ✅ 创建合作 (`POST /api/cooperations/`)
- ✅ 更新合作 (`PUT /api/cooperations/{cooperation_id}`)
- ✅ 删除合作 (`DELETE /api/cooperations/{cooperation_id}`)

### 8. Competitions API（竞赛）
**文件**: `app/api/routes/competitions.py`
- ✅ 创建竞赛 (`POST /api/competitions/`)
- ✅ 更新竞赛 (`PUT /api/competitions/{competition_id}`)
- ✅ 删除竞赛 (`DELETE /api/competitions/{competition_id}`)

### 9. Resources API（资源）
**文件**: `app/api/routes/resources.py`
- ✅ 创建资源 (`POST /api/resources/`)
- ✅ 更新资源 (`PUT /api/resources/{resource_id}`)
- ✅ 删除资源 (`DELETE /api/resources/{resource_id}`)

---

### 📊 覆盖率统计

**已集成**: 9/9 核心模块（100%）🎉
- ✅ Papers（论文）
- ✅ Projects（项目）
- ✅ Patents（专利）
- ✅ Users（用户）
- ✅ Software Copyrights（软著）
- ✅ Conferences（会议）
- ✅ Cooperations（合作）
- ✅ Competitions（竞赛）
- ✅ Resources（资源）

**🎊 所有核心模块已全部集成日志记录！**

---

**日志记录内容**：
- 用户ID（操作者）
- 操作类型（create/update/delete/reset_password）
- 资源类型（paper/project/patent/user）
- 资源ID
- 数据变更（before/after）
- IP地址
- User Agent
- 操作状态（success/failed）
- 错误信息（如果失败）

---

## 自动记录日志示例

### 在API中集成日志记录

**第1步：添加导入**
```python
from fastapi import Request  # 获取请求信息
from app.services.audit_log import audit_log_service
```

**第2步：在函数参数中添加request**
```python
@router.post("/")
async def create_paper(
    paper_data: PaperCreate,
    request: Request,  # ← 添加这个
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
```

**第3步：记录成功和失败日志**
```python
    try:
        # 创建论文
        paper = await crud.create(db, paper_data)
        
        # 记录成功日志
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="create",
            resource_type="paper",
            resource_id=str(paper.id),
            changes={
                "after": {
                    "title": paper.title,
                    "status": paper.status
                }
            },
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            status="success"
        )
        
        return paper
        
    except Exception as e:
        # 记录失败日志
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="create",
            resource_type="paper",
            status="failed",
            error_message=str(e),
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        raise
```

### 记录更新操作

```python
@router.put("/{paper_id}")
async def update_paper(
    paper_id: str,
    paper_data: PaperUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """更新论文（记录变更）"""
    
    # 获取更新前的数据
    old_paper = await crud.get(db, paper_id)
    
    # 执行更新
    updated_paper = await crud.update(db, paper_id, paper_data)
    
    # 记录变更日志
    await audit_log_service.log_action(
        user_id=str(current_user.id),
        action="update",
        resource_type="paper",
        resource_id=paper_id,
        changes={
            "before": {
                "title": old_paper.title,
                "status": old_paper.status
            },
            "after": {
                "title": updated_paper.title,
                "status": updated_paper.status
            }
        },
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    
    return updated_paper
```

### 记录删除操作

```python
@router.delete("/{paper_id}")
async def delete_paper(
    paper_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    """删除论文（记录日志）"""
    
    # 获取删除前的数据
    paper = await crud.get(db, paper_id)
    
    # 执行删除
    await crud.delete(db, paper_id)
    
    # 记录删除日志
    await audit_log_service.log_action(
        user_id=str(current_user.id),
        action="delete",
        resource_type="paper",
        resource_id=paper_id,
        changes={
            "before": {
                "title": paper.title,
                "authors": paper.authors
            }
        },
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    
    return {"message": "删除成功"}
```

## API端点

### 查看我的操作日志
```
GET /api/audit-logs/my?limit=50&skip=0
```

### 查看最近日志（管理员）
```
GET /api/audit-logs/recent?limit=100&action=create
```

### 查看资源操作历史
```
GET /api/audit-logs/resource/paper/paper_123
```

### 日志统计（管理员）
```
GET /api/audit-logs/statistics?start_date=2024-11-01&end_date=2024-11-30
```

### 搜索日志（管理员）
```
GET /api/audit-logs/search?q=论文
```

### 清理旧日志（管理员）
```
POST /api/audit-logs/clean?days=90
```

## MongoDB数据结构

```javascript
{
  _id: ObjectId,
  user_id: "user_uuid",
  action: "create",  // create/update/delete/view/export
  resource_type: "paper",  // paper/project/patent等
  resource_id: "resource_uuid",
  changes: {
    before: {...},  // 更新前数据
    after: {...}    // 更新后数据
  },
  ip_address: "192.168.1.100",
  user_agent: "Mozilla/5.0...",
  status: "success",  // success/failed
  error_message: null,
  timestamp: ISODate("2024-11-16T10:00:00Z"),
  created_at: ISODate("2024-11-16T10:00:00Z"),
  updated_at: ISODate("2024-11-16T10:00:00Z")
}
```

## 日志类型建议

### 操作类型（action）
- `create` - 创建
- `update` - 更新
- `delete` - 删除
- `view` - 查看
- `export` - 导出
- `import` - 导入
- `login` - 登录
- `logout` - 登出
- `download` - 下载
- `upload` - 上传

### 资源类型（resource_type）
- `paper` - 论文
- `project` - 项目
- `patent` - 专利
- `software_copyright` - 软著
- `competition` - 竞赛
- `conference` - 会议
- `cooperation` - 合作
- `resource` - 资源
- `user` - 用户
- `report` - 报告

## 使用场景

### 1. 审计追溯
查看某个用户的所有操作记录，追溯责任。

### 2. 数据变更历史
查看某个资源（如论文）的完整变更历史。

### 3. 安全监控
监控异常操作，如频繁删除、大量导出等。

### 4. 统计分析
分析用户操作习惯，优化系统功能。

### 5. 合规要求
满足数据保护法规要求，记录所有敏感操作。

## 性能优化

### 1. 索引
```python
# 创建索引提升查询性能
await collection.create_index([
    ("user_id", 1),
    ("timestamp", -1)
])

await collection.create_index([
    ("resource_type", 1),
    ("resource_id", 1)
])
```

### 2. 定期清理
```python
# 保留90天的日志
await audit_log_service.clean_old_logs(days=90)
```

### 3. 异步记录
日志记录不要阻塞主业务流程。

## 注意事项

1. **敏感信息**：不要在日志中记录密码、Token等敏感信息
2. **数据量**：定期清理旧日志，避免数据库膨胀
3. **性能**：日志记录失败不应影响主业务
4. **隐私**：遵守数据保护法规，注意用户隐私

## 前端展示示例

```typescript
// 获取我的操作日志
const { data } = await fetch('/api/audit-logs/my?limit=20')

// 展示操作历史
data.logs.map(log => (
  <div>
    <span>{log.action}</span>
    <span>{log.resource_type}</span>
    <span>{new Date(log.timestamp).toLocaleString()}</span>
    <span>{log.ip_address}</span>
  </div>
))
```

## 总结

操作日志系统提供了：
- ✅ 完整的操作追溯
- ✅ 数据变更历史
- ✅ 安全审计功能
- ✅ 合规性支持
- ✅ 统计分析能力

所有数据存储在MongoDB中，支持高效查询和长期保存。

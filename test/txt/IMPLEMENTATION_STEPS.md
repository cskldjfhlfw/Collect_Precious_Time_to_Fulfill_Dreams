# 项目启动功能实现步骤

## 已完成 ✅

1. ✅ 数据库模型更新（`back/app/models/tables.py`）
   - 添加了`startup_script_path`和`startup_command`字段到Project表
   - 创建了`ProjectStartupRequest`表

2. ✅ 数据库迁移SQL（`back/migrations/add_project_startup_fields.sql`）
   - 可以直接在PostgreSQL中执行

3. ✅ 启动请求Schema（`back/app/schemas/startup_requests.py`）

4. ✅ 功能设计文档（`PROJECT_STARTUP_FEATURE.md`）

## 需要手动执行的步骤

### 步骤1：执行数据库迁移
```bash
# 连接到PostgreSQL数据库
psql -U your_username -d your_database

# 执行迁移文件
\i back/migrations/add_project_startup_fields.sql
```

或使用GUI工具（如pgAdmin）执行SQL文件内容。

### 步骤2：更新Projects Schema
需要在`back/app/schemas/projects.py`中添加新字段：
```python
class ProjectBase(BaseSchema):
    # ... 现有字段 ...
    image_path: Optional[str] = None
    startup_script_path: Optional[str] = None
    startup_command: Optional[str] = None
```

### 步骤3：创建后端API文件

由于代码量较大，我已经创建了完整的设计文档。你需要：

1. **创建启动服务**（`back/app/services/project_startup.py`）
   - 执行启动命令
   - 管理进程
   - 实现自动关闭

2. **更新项目API**（`back/app/api/routes/projects.py`）
   - 添加详情接口（包含图片）
   - 添加图片访问接口
   - 添加启动请求接口

3. **创建授权管理API**（`back/app/api/routes/startup_approvals.py`）
   - 获取待审批列表
   - 审批/拒绝接口
   - 停止项目接口

### 步骤4：更新前端

1. **更新API调用**（`front/lib/api.ts`）
   - 添加项目详情API
   - 添加启动请求API
   - 添加授权管理API

2. **更新项目页面**（`front/app/(dashboard)/projects/page.tsx`）
   - 详情视图显示图片
   - 添加启动按钮
   - 添加启动请求对话框

3. **创建授权管理页面**（`front/app/(dashboard)/startup-approvals/page.tsx`）
   - 显示待审批列表
   - 审批/拒绝功能
   - 实时状态更新

## 简化实现方案

如果完整实现太复杂，可以先实现核心功能：

### 最小可行版本（MVP）

1. **只实现图片显示**
   - 项目详情视图显示图片
   - 按需加载（只在详情视图加载）
   - 图片压缩显示

2. **简化启动流程**
   - 去掉审批流程，管理员直接启动
   - 手动停止，不实现自动关闭
   - 不记录启动历史

### MVP实现步骤

#### 1. 数据库（已完成）
执行迁移SQL即可

#### 2. 后端API（3个接口）

**A. 项目详情API**
```python
@router.get("/{project_id}/detail")
async def get_project_detail(project_id: UUID, db: AsyncSession):
    project = await crud_project.get(db, project_id)
    return project
```

**B. 项目图片API**
```python
@router.get("/{project_id}/image")
async def get_project_image(project_id: UUID, db: AsyncSession):
    project = await crud_project.get(db, project_id)
    if not project.image_path:
        raise HTTPException(404)
    
    image_path = Path(project.image_path)
    if not image_path.is_absolute():
        image_path = Path.cwd() / image_path
    
    return FileResponse(image_path)
```

**C. 启动项目API（管理员）**
```python
@router.post("/{project_id}/startup")
async def startup_project(
    project_id: UUID,
    db: AsyncSession,
    current_user: User = Depends(get_current_admin_user)
):
    project = await crud_project.get(db, project_id)
    if not project.startup_command:
        raise HTTPException(400, "No startup command configured")
    
    # 执行启动命令
    import subprocess
    process = subprocess.Popen(
        project.startup_command,
        shell=True,
        cwd=f"./projects/{project.project_number}"
    )
    
    return {"message": "Project started", "pid": process.pid}
```

#### 3. 前端实现（2个改动）

**A. 更新API调用**
```typescript
// front/lib/api.ts
export const projectsApi = {
  // ... 现有方法 ...
  
  getDetail: (id: string): Promise<ProjectDetail> =>
    apiRequest(`/projects/${id}/detail`),
  
  startup: (id: string): Promise<{message: string}> =>
    apiRequest(`/projects/${id}/startup`, { method: 'POST' }),
}
```

**B. 更新项目页面**
```tsx
// front/app/(dashboard)/projects/page.tsx

// 在详情视图中添加：
{detailedProject?.image_path && (
  <div className="mb-4">
    <img 
      src={`/api/projects/${selectedProject.id}/image`}
      alt={detailedProject.name}
      style={{
        maxWidth: '600px',
        maxHeight: '400px',
        objectFit: 'contain',
        border: '1px solid #ddd',
        borderRadius: '4px'
      }}
    />
  </div>
)}

{detailedProject?.startup_command && canEdit && (
  <Button onClick={handleStartup}>
    启动项目
  </Button>
)}
```

## 测试步骤

### 1. 测试图片显示
1. 在数据库中为某个项目设置image_path
2. 将图片放到`back/uploads/images/`
3. 进入项目详情视图
4. 确认图片正确显示

### 2. 测试启动功能（如果实现）
1. 在数据库中设置startup_command
2. 在`./projects/`下创建测试脚本
3. 点击启动按钮
4. 检查进程是否启动

## 推荐实施顺序

1. **第一阶段**：只实现图片显示（最简单）
2. **第二阶段**：添加简单的启动按钮（管理员直接启动）
3. **第三阶段**：添加审批流程
4. **第四阶段**：添加自动关闭机制

## 需要的依赖

如果要实现完整的启动功能，需要安装：
```bash
pip install psutil  # 用于进程管理
```

## 注意事项

1. **安全性**：启动命令必须经过严格验证
2. **权限**：确保后端有执行脚本的权限
3. **路径**：所有路径都应该是相对路径
4. **错误处理**：脚本执行失败时要有明确的错误提示
5. **日志**：记录所有启动和停止操作

## 获取帮助

如果需要完整的代码实现，请告诉我你想先实现哪个部分：
- A. 只实现图片显示
- B. 图片显示 + 简单启动（无审批）
- C. 完整功能（包括审批和自动关闭）

我会根据你的选择提供详细的代码实现。

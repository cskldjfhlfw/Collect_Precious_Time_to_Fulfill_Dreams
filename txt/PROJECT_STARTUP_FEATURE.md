# 项目启动功能实现文档

## 功能概述

实现项目详情视图中的图片显示和启动按钮功能，包括：
1. 项目详情视图显示项目图片（按需加载）
2. 启动按钮（需要管理员授权）
3. 自动关闭机制（1小时后）
4. 管理员授权管理页面

## 数据库设计

### 1. Projects表新增字段
```sql
startup_script_path VARCHAR(500)  -- 启动脚本路径（相对于projects目录）
startup_command TEXT              -- 启动命令
```

### 2. 新增表：project_startup_requests
```sql
CREATE TABLE project_startup_requests (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL,
    requester_id UUID NOT NULL,
    approver_id UUID,
    status VARCHAR(20) DEFAULT 'pending',
    request_reason TEXT,
    reject_reason TEXT,
    approved_at TIMESTAMP,
    started_at TIMESTAMP,
    expires_at TIMESTAMP,
    process_id INTEGER,
    is_running BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

## 后端API设计

### 1. 项目详情API（包含图片）
```
GET /api/projects/{project_id}/detail
```
响应：
```json
{
  "id": "uuid",
  "name": "项目名称",
  "image_path": "uploads/images/project_xxx.png",
  "startup_command": "start.sh",
  "can_startup": true,
  "is_running": false,
  ...
}
```

### 2. 项目图片访问API
```
GET /api/projects/{project_id}/image
```
返回图片文件流

### 3. 项目启动请求API
```
POST /api/projects/{project_id}/startup-request
Body: {
  "request_reason": "需要测试功能"
}
```

### 4. 获取启动请求列表（管理员）
```
GET /api/projects/startup-requests?status=pending
```

### 5. 审批启动请求（管理员）
```
POST /api/projects/startup-requests/{request_id}/approve
POST /api/projects/startup-requests/{request_id}/reject
Body: {
  "reject_reason": "不符合要求"  // 仅拒绝时需要
}
```

### 6. 停止项目
```
POST /api/projects/startup-requests/{request_id}/stop
```

## 前端实现

### 1. 项目详情视图
```tsx
<TabsContent value="detail">
  {/* 项目图片 */}
  {detailedProject?.image_path && (
    <img 
      src={`/api/projects/${selectedProject.id}/image`}
      style={{ maxWidth: '600px', maxHeight: '400px', objectFit: 'contain' }}
    />
  )}
  
  {/* 启动按钮 */}
  {detailedProject?.startup_command && (
    <Button onClick={handleStartupRequest}>
      {isRunning ? '运行中' : '启动项目'}
    </Button>
  )}
</TabsContent>
```

### 2. 授权管理页面
```
/dashboard/startup-approvals
```
显示所有待审批的启动请求，管理员可以批准或拒绝。

## 启动流程

### 用户请求启动
1. 用户点击"启动项目"按钮
2. 弹出对话框输入请求原因
3. 提交启动请求
4. 显示"等待管理员授权"状态

### 管理员审批
1. 管理员进入授权管理页面
2. 查看待审批请求列表
3. 点击"批准"或"拒绝"
4. 如果批准，后端执行启动命令

### 自动执行
1. 审批通过后，后端执行启动脚本
2. 记录进程ID和启动时间
3. 设置过期时间（1小时后）
4. 创建定时任务，1小时后自动关闭

### 自动关闭
1. 后台任务每分钟检查过期的请求
2. 如果当前时间 > expires_at，执行关闭
3. 终止进程，更新状态为'expired'

## 安全考虑

### 1. 权限控制
- 只有登录用户可以请求启动
- 只有管理员可以审批
- 只有请求人或管理员可以停止

### 2. 命令安全
- 启动命令存储在数据库中，不允许用户输入
- 脚本路径限制在projects目录下
- 使用subprocess安全执行，不使用shell=True

### 3. 资源限制
- 同一项目同时只能有一个运行实例
- 强制1小时后自动关闭
- 记录所有启动和停止操作

## 文件结构

```
back/
├── app/
│   ├── api/
│   │   └── routes/
│   │       ├── projects.py          # 项目API（新增启动相关接口）
│   │       └── startup_approvals.py # 授权管理API（新建）
│   ├── models/
│   │   └── tables.py                # 数据库模型（已更新）
│   ├── schemas/
│   │   ├── projects.py              # 项目Schema（需更新）
│   │   └── startup_requests.py      # 启动请求Schema（新建）
│   ├── crud/
│   │   └── crud_startup_request.py  # 启动请求CRUD（新建）
│   └── services/
│       └── project_startup.py       # 启动服务（新建）
├── migrations/
│   └── add_project_startup_fields.sql
└── uploads/
    └── images/                      # 项目图片存储

front/
├── app/
│   └── (dashboard)/
│       ├── projects/
│       │   └── page.tsx             # 项目页面（需更新）
│       └── startup-approvals/
│           └── page.tsx             # 授权管理页面（新建）
└── lib/
    └── api.ts                       # API调用（需更新）
```

## 实现步骤

### 阶段1：数据库和基础API ✅
1. [x] 添加数据库字段
2. [x] 创建启动请求表
3. [x] 创建迁移SQL文件

### 阶段2：后端API（进行中）
4. [ ] 创建项目详情API（包含图片）
5. [ ] 创建图片访问API
6. [ ] 创建启动请求CRUD
7. [ ] 创建启动服务
8. [ ] 创建授权管理API

### 阶段3：前端实现
9. [ ] 更新项目详情视图（显示图片）
10. [ ] 添加启动按钮和对话框
11. [ ] 创建授权管理页面
12. [ ] 更新API调用

### 阶段4：测试和优化
13. [ ] 测试完整启动流程
14. [ ] 测试自动关闭机制
15. [ ] 测试权限控制
16. [ ] 性能优化

## 使用示例

### 1. 配置项目启动命令
在数据库中为项目设置：
```sql
UPDATE projects 
SET startup_script_path = 'my-project/start.sh',
    startup_command = 'bash start.sh'
WHERE id = 'project-uuid';
```

### 2. 用户请求启动
1. 进入项目详情页
2. 点击"启动项目"按钮
3. 输入请求原因："需要进行功能测试"
4. 提交请求

### 3. 管理员审批
1. 进入"启动授权管理"页面
2. 看到待审批请求
3. 点击"批准"
4. 项目自动启动

### 4. 自动关闭
1小时后，系统自动：
- 终止项目进程
- 更新状态为'expired'
- 发送通知（可选）

## 注意事项

1. **脚本路径**：必须是相对于`./projects`目录的路径
2. **Windows支持**：使用`.bat`或`.ps1`脚本
3. **进程管理**：使用psutil库管理进程
4. **日志记录**：记录所有启动和停止操作
5. **错误处理**：脚本执行失败时的处理
6. **并发控制**：同一项目不能同时运行多个实例

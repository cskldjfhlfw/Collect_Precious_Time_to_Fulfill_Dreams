# 项目启动审批功能实现文档

## 功能概述

实现了完整的项目启动审批流程，包括：
- **管理员**：直接启动项目，默认运行1小时后自动关闭
- **普通用户**：提交启动申请，需要管理员审批后才能启动

## 实现内容

### 1. 后端API实现

#### 文件：`back/app/api/routes/projects.py`

**新增API端点：**

1. **获取待审批列表** - `GET /api/projects/startup-requests/pending`
   - 权限：仅管理员
   - 返回所有待审批的项目启动请求
   - 包含项目名称、申请人、申请理由、申请时间等信息

2. **审批通过** - `POST /api/projects/startup-requests/{request_id}/approve`
   - 权限：仅管理员
   - 通过审批后自动启动项目
   - 执行启动脚本（如果配置了）
   - 设置过期时间（默认1小时）
   - 记录进程ID和运行状态

3. **审批拒绝** - `POST /api/projects/startup-requests/{request_id}/reject`
   - 权限：仅管理员
   - 需要提供拒绝原因
   - 更新请求状态为rejected

**修改的API端点：**

4. **启动项目** - `POST /api/projects/{project_id}/start`
   - 管理员：直接启动（原有逻辑保持不变）
   - 普通用户：创建待审批的启动请求记录
   - 检查是否已有待审批的请求，避免重复提交

### 2. 数据库Schema

#### 文件：`back/app/schemas/startup_requests.py`

已存在的Schema包含：
- `StartupRequestBase`: 基础字段（申请理由）
- `StartupRequestCreate`: 创建请求
- `StartupRequestUpdate`: 更新请求
- `StartupRequestResponse`: 响应模型（包含关联信息）

### 3. 前端审批页面

#### 文件：`front/app/(dashboard)/admin/approvals/page.tsx`

**功能特性：**
- 显示待审批请求列表
- 实时统计待审批数量
- 卡片式展示每个请求的详细信息
- 审批通过对话框（确认操作）
- 审批拒绝对话框（必须填写拒绝原因）
- 自动刷新列表
- 错误处理和用户反馈

**UI组件：**
- 统计卡片：显示待审批数量
- 请求卡片：左侧黄色边框，显示项目信息
- 操作按钮：通过/拒绝
- 确认对话框：防止误操作

### 4. 用户菜单入口

#### 文件：`front/components/top-nav.tsx`

**修改内容：**
- 在用户下拉菜单中添加"审批管理"入口
- 位置：日志管理下方
- 权限：管理员和超级管理员可见
- 路由：`/admin/approvals`

### 5. 用户端申请流程

#### 文件：`front/app/(dashboard)/projects/page.tsx`

**新增功能：**
- 检测用户角色，区分管理员和普通用户
- 普通用户点击启动按钮时弹出申请理由对话框
- 申请理由对话框包含：
  - 项目名称显示
  - 申请理由输入框（必填）
  - 提交/取消按钮
- 提交后显示成功提示
- 防止重复提交（后端检查）

## 配置说明

### 环境变量配置

在 `.env` 文件中可以配置项目启动时长：

```env
APP_PROJECT_STARTUP_DURATION_HOURS=1
```

默认值为1小时，可根据需要调整。

### 配置文件

#### 文件：`back/app/core/config.py`

```python
project_startup_duration_hours: int = Field(default=1, description="项目启动默认时长（小时）")
```

## 使用流程

### 管理员直接启动

1. 登录管理员账号
2. 进入项目页面
3. 选择项目，切换到详情标签页
4. 点击"启动"按钮
5. 确认启动
6. 项目立即启动，默认运行1小时

### 普通用户申请启动

1. 登录普通用户账号
2. 进入项目页面
3. 选择项目，切换到详情标签页
4. 点击"启动"按钮
5. 填写申请理由
6. 提交申请
7. 等待管理员审批

### 管理员审批流程

1. 登录管理员账号
2. 点击右上角头像
3. 选择"审批管理"
4. 查看待审批列表
5. 点击"通过"或"拒绝"按钮
6. 确认操作（拒绝需填写原因）
7. 审批完成

## API接口说明

### 1. 获取待审批列表

```
GET /api/projects/startup-requests/pending
Authorization: Bearer {token}
```

**响应示例：**
```json
[
  {
    "id": "uuid",
    "project_id": "uuid",
    "project_name": "项目名称",
    "requester_id": "uuid",
    "requester_name": "申请人",
    "request_reason": "申请理由",
    "status": "pending",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

### 2. 审批通过

```
POST /api/projects/startup-requests/{request_id}/approve
Authorization: Bearer {token}
```

**响应示例：**
```json
{
  "message": "项目启动成功，进程ID: 12345",
  "request_id": "uuid",
  "start_time": "2024-01-01T00:00:00Z",
  "end_time": "2024-01-01T01:00:00Z",
  "duration_hours": 1,
  "process_id": 12345
}
```

### 3. 审批拒绝

```
POST /api/projects/startup-requests/{request_id}/reject?reject_reason=拒绝原因
Authorization: Bearer {token}
```

**响应示例：**
```json
{
  "message": "已拒绝启动请求",
  "request_id": "uuid",
  "reject_reason": "拒绝原因"
}
```

### 4. 提交启动申请

```
POST /api/projects/{project_id}/start
Authorization: Bearer {token}
Content-Type: application/json

{
  "request_reason": "申请理由"
}
```

**响应示例：**
```json
{
  "message": "启动请求已提交，请等待管理员审批",
  "user_role": "user",
  "requires_approval": true,
  "request_id": "uuid",
  "status": "pending"
}
```

## 数据库表结构

### project_startup_requests 表

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | UUID | 主键 |
| project_id | UUID | 项目ID（外键） |
| requester_id | UUID | 申请人ID（外键） |
| approver_id | UUID | 审批人ID（外键，可空） |
| status | String | 状态：pending/approved/rejected/expired |
| request_reason | Text | 申请理由 |
| reject_reason | Text | 拒绝原因 |
| approved_at | DateTime | 审批时间 |
| started_at | DateTime | 启动时间 |
| expires_at | DateTime | 过期时间（1小时后） |
| process_id | Integer | 进程ID |
| is_running | Boolean | 是否运行中 |
| created_at | DateTime | 创建时间 |
| updated_at | DateTime | 更新时间 |

## 权限控制

- **审批管理页面**：仅管理员（admin）和超级管理员（superadmin）可访问
- **审批操作**：仅管理员可执行
- **直接启动**：仅管理员可直接启动
- **申请启动**：普通用户只能提交申请

## 审计日志

所有操作都会记录审计日志：
- 管理员直接启动
- 用户提交申请
- 管理员审批通过
- 管理员审批拒绝

## 注意事项

1. **重复申请检查**：用户不能对同一项目提交多个待审批的请求
2. **状态检查**：只有pending状态的请求才能被审批
3. **进程管理**：审批通过后会执行启动脚本并记录进程ID
4. **自动关闭**：项目启动后会在配置的时长后自动关闭
5. **错误处理**：所有操作都有完善的错误处理和用户提示

## 测试建议

1. **普通用户测试**：
   - 提交启动申请
   - 检查是否能重复提交
   - 验证申请理由必填

2. **管理员测试**：
   - 直接启动项目
   - 查看待审批列表
   - 审批通过操作
   - 审批拒绝操作（必填拒绝理由）

3. **权限测试**：
   - 普通用户不能访问审批页面
   - 普通用户不能直接启动项目

4. **流程测试**：
   - 完整的申请-审批-启动流程
   - 申请-拒绝流程
   - 多个用户同时申请

## 文件清单

### 后端文件
- `back/app/api/routes/projects.py` - 项目API路由（修改）
- `back/app/schemas/startup_requests.py` - 启动请求Schema（已存在）
- `back/app/models/tables.py` - 数据库模型（已存在）
- `back/app/core/config.py` - 配置文件（已存在）

### 前端文件
- `front/app/(dashboard)/admin/approvals/page.tsx` - 审批管理页面（新建）
- `front/app/(dashboard)/projects/page.tsx` - 项目页面（修改）
- `front/components/top-nav.tsx` - 顶部导航（修改）

## 后续优化建议

1. **通知功能**：
   - 用户提交申请后通知管理员
   - 审批结果通知申请人

2. **批量操作**：
   - 支持批量审批通过
   - 支持批量拒绝

3. **审批历史**：
   - 显示所有审批记录
   - 支持按状态筛选

4. **申请撤回**：
   - 用户可以撤回pending状态的申请

5. **审批备注**：
   - 管理员审批时可以添加备注

6. **邮件通知**：
   - 审批结果发送邮件通知

7. **统计分析**：
   - 审批通过率统计
   - 平均审批时长统计

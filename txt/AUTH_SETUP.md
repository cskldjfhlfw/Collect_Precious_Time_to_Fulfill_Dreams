# 认证系统设置指南

## 🔐 功能概述

已完成完整的认证和权限管理系统：

### ✅ 后端功能
1. **用户注册和登录**
   - 支持用户名或邮箱登录
   - JWT令牌认证
   - 密码加密存储（bcrypt）
   - 首个用户自动设为超级管理员

2. **权限管理**
   - 三种角色：superadmin（超级管理员）、admin（管理员）、user（普通用户）
   - 基于角色的访问控制（RBAC）
   - 用户管理API（仅超级管理员）

3. **用户管理**
   - 查看所有用户
   - 编辑用户信息
   - 修改用户权限
   - 重置用户密码
   - 删除用户

### ✅ 前端功能
1. **认证界面**
   - 3D动画登录页面
   - 登录/注册表单
   - 错误提示
   - 表单验证

2. **用户管理界面**
   - 用户列表（带搜索和筛选）
   - 编辑用户信息
   - 修改用户角色
   - 重置密码
   - 删除用户

---

## 📦 安装依赖

### 1. 后端依赖

```bash
cd back
pip install python-jose[cryptography] passlib[bcrypt]
```

或使用requirements文件：
```bash
pip install -r requirements_auth.txt
```

### 2. 前端依赖

前端不需要额外安装依赖，已使用的包都已包含在项目中。

---

## 🚀 启动步骤

### 1. 启动后端

```bash
cd back
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. 启动前端

```bash
cd front
npm run dev
```

---

## 📝 使用流程

### 首次使用

1. **访问系统**
   - 打开浏览器访问 `http://localhost:3000`
   - 系统会自动跳转到认证页面 `/auth`

2. **注册第一个用户（超级管理员）**
   - 点击右上角"注册"按钮
   - 填写信息：
     - 姓名：你的名字
     - 邮箱：admin@example.com
     - 密码：至少6位
     - 确认密码
   - 点击"注册"按钮
   - **第一个注册的用户自动成为超级管理员**

3. **登录系统**
   - 使用用户名或邮箱登录：
     - 用户名/邮箱：admin@example.com 或 admin
     - 密码：你设置的密码
   - 登录成功后自动跳转到论文页面

4. **访问用户管理**
   - 登录后，在侧边栏点击"管理员" → "用户管理"
   - 或直接访问 `http://localhost:3000/admin/users`

---

## 🔧 API端点

### 认证相关

```
POST /api/auth/register        # 用户注册
POST /api/auth/login           # 用户登录
GET  /api/auth/me              # 获取当前用户信息
POST /api/auth/change-password # 修改密码
```

### 用户管理（需要超级管理员权限）

```
GET    /api/users              # 获取用户列表
GET    /api/users/{id}         # 获取用户详情
PATCH  /api/users/{id}         # 更新用户信息
DELETE /api/users/{id}         # 删除用户
POST   /api/users/{id}/reset-password  # 重置用户密码
```

---

## 🎨 前端路由

```
/auth                          # 认证页面（登录/注册）
/login                         # 登录（显示登录表单）
/register                      # 注册（显示注册表单）
/admin/users                   # 用户管理（超级管理员）
/(dashboard)/*                 # 所有dashboard页面需要认证
```

---

## 🔑 角色权限

| 角色 | 权限 |
|------|------|
| **superadmin** | 所有权限 + 用户管理 |
| **admin** | 管理数据，但不能管理用户 |
| **user** | 查看和编辑自己的数据 |

---

## 💡 使用技巧

### 1. 支持用户名或邮箱登录
登录时可以使用：
- 邮箱：`admin@example.com`
- 用户名：`admin`（自动从邮箱前缀生成）

### 2. 密码要求
- 最少6个字符
- 建议使用字母、数字和特殊字符组合

### 3. 角色管理
- 只有超级管理员可以修改用户角色
- 不能修改自己的角色
- 不能删除自己的账户

### 4. 安全措施
- 密码使用bcrypt加密存储
- JWT令牌有效期30天
- 所有管理API需要超级管理员权限

---

## 🐛 问题排查

### 1. 后端启动失败

**错误**: `ModuleNotFoundError: No module named 'jose'`

**解决**:
```bash
pip install python-jose[cryptography] passlib[bcrypt]
```

### 2. 登录后无法访问管理页面

**原因**: 用户不是超级管理员

**解决**: 
- 确保使用第一个注册的账户登录
- 或让现有超级管理员修改你的角色为 `superadmin`

### 3. 页面显示403错误

**原因**: 权限不足

**解决**: 检查用户角色是否正确

### 4. Token失效

**原因**: JWT令牌过期（30天）

**解决**: 重新登录

---

## 🔒 安全注意事项

### 生产环境配置

在生产环境中，请务必修改：

1. **JWT密钥**（`back/app/core/security.py`）:
```python
SECRET_KEY = "your-production-secret-key-here-use-a-long-random-string"
```

生成安全密钥：
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

2. **数据库连接**（`back/.env`）:
```env
POSTGRES_DSN=postgresql+asyncpg://user:password@localhost:5432/production_db
```

3. **CORS设置**（`back/app/core/config.py`）:
```python
cors_origins = ["https://your-production-domain.com"]
```

---

## 📊 数据库表结构

### users表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| username | String(50) | 用户名（唯一） |
| email | String(100) | 邮箱（唯一） |
| password_hash | String(255) | 密码哈希 |
| role | String(20) | 角色（user/admin/superadmin） |
| created_at | DateTime | 创建时间 |
| updated_at | DateTime | 更新时间 |

---

## 🎯 下一步

1. ✅ 在导航栏添加用户信息显示
2. ✅ 添加退出登录功能
3. ✅ 添加管理员入口到侧边栏
4. ✅ 实现路由保护中间件
5. ⏳ 完善用户个人资料页面
6. ⏳ 添加忘记密码功能
7. ⏳ 添加邮箱验证功能

---

## 📝 文件清单

### 后端文件
```
back/app/
├── core/
│   └── security.py          # 加密和JWT工具
├── schemas/
│   └── auth.py              # 认证相关模型
├── api/
│   ├── deps.py              # 依赖注入（获取当前用户）
│   └── routes/
│       ├── auth.py          # 认证API
│       └── users.py         # 用户管理API
└── models/
    └── tables.py            # User模型（已存在）
```

### 前端文件
```
front/
├── contexts/
│   └── auth-context.tsx     # 认证上下文
├── lib/api/
│   ├── auth.ts              # 认证API调用
│   └── users.ts             # 用户管理API调用
├── app/
│   ├── (auth)/
│   │   └── _components/
│   │       └── auth-page.tsx  # 登录注册页面
│   └── (dashboard)/
│       └── admin/users/
│           └── page.tsx     # 用户管理页面
└── middleware.ts            # 路由保护
```

---

**创建时间**: 2024-11-15  
**版本**: v1.0  
**状态**: ✅ 完成

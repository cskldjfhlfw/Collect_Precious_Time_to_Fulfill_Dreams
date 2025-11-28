# 🚀 认证系统快速启动指南

## ⚠️ 重要：先安装依赖！

### 后端依赖安装

```bash
cd back
pip install python-jose[cryptography] passlib[bcrypt]
```

## 🎯 快速启动

### 1. 启动后端

```bash
cd back
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**注意**：如果看到 `ModuleNotFoundError`，说明依赖未安装，请先执行上面的安装命令。

### 2. 启动前端

```bash
cd front
npm run dev
```

### 3. 访问系统

打开浏览器访问：`http://localhost:3000`

系统会自动跳转到登录页面。

---

## 📝 首次使用

### 注册第一个用户（超级管理员）

1. 点击"注册"按钮
2. 填写信息：
   ```
   姓名：管理员
   邮箱：admin@example.com
   密码：admin123（或你喜欢的密码，至少6位）
   确认密码：admin123
   ```
3. 点击"注册"
4. **第一个用户自动成为超级管理员**

### 登录系统

支持两种登录方式：

**方式1：使用邮箱**
```
用户名/邮箱：admin@example.com
密码：admin123
```

**方式2：使用用户名**
```
用户名/邮箱：admin（自动从邮箱前缀生成）
密码：admin123
```

---

## 🔧 问题修复

### 问题1：后端启动失败

**错误信息**:
```
ModuleNotFoundError: No module named 'jose'
```

**解决方案**:
```bash
cd back
pip install python-jose[cryptography] passlib[bcrypt]
```

### 问题2：点击注册/登录没反应

**原因**：后端未启动或启动失败

**解决方案**：
1. 检查后端是否正常运行
2. 查看后端终端是否有错误信息
3. 确保依赖已安装

### 问题3：字体显示问题

**症状**：英文字体显示异常

**解决方案**：
1. 清除浏览器缓存
2. 刷新页面（Ctrl+F5 或 Cmd+Shift+R）
3. 检查网络连接（字体从Google Fonts加载）

---

## ✅ 功能清单

### 已实现

- ✅ 用户注册和登录
- ✅ 支持用户名或邮箱登录
- ✅ JWT令牌认证
- ✅ 密码加密存储
- ✅ 首个用户自动成为超级管理员
- ✅ 用户管理页面（超级管理员）
- ✅ 修改用户角色
- ✅ 重置用户密码
- ✅ 删除用户
- ✅ 路由保护中间件

### 待完善

- ⏳ 在导航栏显示用户信息
- ⏳ 添加退出登录按钮
- ⏳ 添加管理员入口到侧边栏
- ⏳ 用户个人资料页面
- ⏳ 忘记密码功能
- ⏳ 邮箱验证

---

## 📂 主要文件位置

### 后端
```
back/app/
├── core/security.py           # 加密和JWT
├── schemas/auth.py            # 认证模型
├── api/deps.py                # 权限依赖
└── api/routes/
    ├── auth.py                # 认证API
    └── users.py               # 用户管理API
```

### 前端
```
front/
├── contexts/auth-context.tsx  # 认证上下文
├── lib/api/
│   ├── auth.ts                # 认证API
│   └── users.ts               # 用户API
├── app/(auth)/_components/
│   └── auth-page.tsx          # 登录注册页面
└── app/(dashboard)/admin/users/
    └── page.tsx               # 用户管理页面
```

---

## 🔐 安全提示

### 生产环境必须修改

在 `back/app/core/security.py` 中修改JWT密钥：

```python
# 当前（开发环境）
SECRET_KEY = "your-secret-key-change-this-in-production-09af8s7df0a8sf"

# 修改为（生产环境）
SECRET_KEY = "你的超长随机字符串"  # 至少32位
```

生成安全密钥：
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## 📞 获取帮助

详细文档：`AUTH_SETUP.md`

---

**创建时间**: 2024-11-15  
**状态**: ✅ 可用

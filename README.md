# Collect Precious Time to Fulfill Dreams

> 拾光筑梦 - 学术成果管理与项目协作平台

## 📋 项目简介

这是一个全栈学术成果管理系统，旨在帮助研究人员、学生和团队高效管理论文、专利、项目和竞赛等学术资源，并提供智能化的协作和分析功能。

### 核心功能

- 📚 **学术成果管理**: 论文、专利、项目、竞赛的全生命周期管理
- 👥 **团队协作**: 多用户协作、权限管理、任务分配
- 🤖 **AI 辅助**: 集成智谱 AI 和 OpenAI，提供智能分析和建议
- 📊 **数据可视化**: 知识图谱、统计分析、趋势预测
- 🔐 **安全可靠**: JWT 认证、Token 黑名单、完善的权限控制

---

## 🏗️ 技术架构

### 后端技术栈

- **框架**: FastAPI (Python 3.10+)
- **数据库**:
  - PostgreSQL - 关系型数据存储
  - Neo4j - 知识图谱和关系网络
  - MongoDB - 文档和非结构化数据
  - Redis - 缓存和 Token 黑名单
- **认证**: JWT + Token Blacklist
- **AI 集成**: 智谱 AI、OpenAI
- **ORM**: SQLAlchemy (异步)

### 前端技术栈

- **框架**: Next.js 14.2 (React 18.3)
- **UI 组件**: Radix UI + shadcn/ui
- **图标**: Lucide React
- **样式**: TailwindCSS
- **数据可视化**: Recharts, React Force Graph
- **3D 渲染**: Three.js + React Three Fiber
- **表单**: React Hook Form + Zod
- **主题**: next-themes

### 项目结构

```
Collect_Precious_Time_to_Fulfill_Dreams/
├── back/                      # 后端代码
│   ├── app/
│   │   ├── api/              # API 路由
│   │   │   └── routes/       # 具体路由模块
│   │   ├── core/             # 核心配置和安全
│   │   ├── crud/             # 数据库操作层
│   │   ├── db/               # 数据库连接
│   │   ├── models/           # SQLAlchemy 数据模型
│   │   ├── schemas/          # Pydantic 数据模式
│   │   ├── services/         # 业务逻辑服务
│   │   └── middleware/       # 中间件
│   ├── alembic/              # 数据库迁移
│   ├── .env.example          # 环境变量模板
│   ├── requirements.txt      # Python 依赖
│   └── main.py               # FastAPI 应用入口
├── front/                     # 前端代码 (Next.js)
│   ├── app/                  # Next.js App Router
│   ├── components/           # React 组件
│   ├── contexts/             # React Context
│   ├── hooks/                # 自定义 Hooks
│   ├── lib/                  # 工具函数
│   ├── public/               # 静态资源
│   ├── package.json          # Node.js 依赖
│   └── next.config.mjs       # Next.js 配置
├── projects/                  # 子项目
│   └── test-web-service/     # 测试 Web 服务
├── lists/                     # 数据文件
├── test/                      # 测试脚本
├── .gitignore                # Git 忽略规则
├── SECURITY_FIXES.md         # 安全修复文档
└── README.md                 # 本文件
```

---

## 🚀 快速开始

### 前置要求

- Python 3.10+
- Node.js 16+
- PostgreSQL 14+
- Neo4j 5+
- MongoDB 6+
- Redis 7+
- Docker (可选)

### 1. 克隆项目

```bash
git clone <repository-url>
cd Collect_Precious_Time_to_Fulfill_Dreams
```

### 2. 后端配置

#### 2.1 创建虚拟环境

```bash
# 使用 conda
conda create -n yanzhengma python=3.10
conda activate yanzhengma

# 或使用 venv
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或
.\venv\Scripts\activate   # Windows
```

#### 2.2 安装依赖

```bash
cd back
pip install -r requirements.txt
```

#### 2.3 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 生成 JWT 密钥
python -c "import secrets; print(secrets.token_urlsafe(32))"

# 编辑 .env 文件，设置以下必需配置：
# - APP_JWT_SECRET_KEY: 上面生成的密钥
# - DATABASE_URL: PostgreSQL 连接字符串
# - APP_ZHIPU_API_KEY: 智谱 AI API 密钥（可选）
```

**`.env` 文件示例**:

```env
# JWT 密钥（必须）
APP_JWT_SECRET_KEY=your-generated-secret-key-here

# 数据库配置
APP_POSTGRES_ENABLED=true
APP_POSTGRES_DSN=postgresql+asyncpg://user:password@localhost:5432/dbname

APP_NEO4J_ENABLED=true
APP_NEO4J_URI=bolt://localhost:7687
APP_NEO4J_USER=neo4j
APP_NEO4J_PASSWORD=password

APP_MONGO_ENABLED=true
APP_MONGO_DSN=mongodb://localhost:27017
APP_MONGO_DATABASE=academic_db

APP_REDIS_ENABLED=true
APP_REDIS_DSN=redis://localhost:6379/0

# AI 配置（可选）
APP_ZHIPU_API_KEY=your-zhipu-api-key
APP_OPENAI_API_KEY=your-openai-api-key

# CORS 配置
APP_CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

#### 2.4 初始化数据库

```bash
# 运行数据库迁移
python -m alembic upgrade head

# 导入初始数据（如果有）
python scripts/init_data.py
```

#### 2.5 启动后端服务

```bash
# 进入后端目录
cd back

# 开发模式（自动重载）
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# 生产模式（多进程）
uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 4
```

后端服务将在 `http://localhost:8000` 运行。

- **API 文档 (Swagger)**: `http://localhost:8000/docs`
- **API 文档 (ReDoc)**: `http://localhost:8000/redoc`
- **健康检查**: `http://localhost:8000/api/health`

### 3. 前端配置

```bash
cd front

# 安装依赖（推荐使用 pnpm）
pnpm install
# 或使用 npm
npm install

# 启动开发服务器
pnpm dev
# 或
npm run dev

# 构建生产版本
pnpm build
# 或
npm run build

# 启动生产服务器
pnpm start
# 或
npm start
```

前端服务将在 `http://localhost:3000` 运行。

---

## 🔒 安全特性

本项目已通过 Semgrep 安全扫描，并修复了所有发现的安全问题。详见 [SECURITY_FIXES.md](./SECURITY_FIXES.md)。

### 已实施的安全措施

✅ **密钥管理**
- 所有敏感信息从环境变量读取
- JWT 密钥强制验证
- `.env` 文件被 Git 忽略

✅ **JWT 安全**
- 使用强密钥签名
- Token 黑名单机制（登出后立即失效）
- 验证 Token 签名

✅ **SQL 注入防护**
- 使用 SQLAlchemy ORM
- 表名白名单验证
- 参数化查询

✅ **网络安全**
- 默认仅本地访问
- CORS 配置
- 环境变量控制外部访问

### 安全配置检查清单

- [ ] 已设置强 JWT 密钥（至少 32 字节）
- [ ] `.env` 文件未提交到版本控制
- [ ] 数据库使用强密码
- [ ] Redis 配置了密码保护
- [ ] 生产环境禁用 Debug 模式
- [ ] 配置了适当的 CORS 策略
- [ ] 定期更新依赖包

---

## 📚 API 文档

### 核心模块

#### 认证与用户
- `/api/auth/*` - 用户认证（登录、登出、注册）
- `/api/users/*` - 用户管理
- `/api/system/*` - 系统管理

#### 学术成果管理
- `/api/papers/*` - 论文管理（PostgreSQL）
- `/api/paper-documents/*` - 论文文档（MongoDB）
- `/api/patents/*` - 专利管理
- `/api/projects/*` - 项目管理（支持启动/停止）
- `/api/competitions/*` - 竞赛管理
- `/api/conferences/*` - 会议管理
- `/api/software-copyrights/*` - 软件著作权管理
- `/api/cooperations/*` - 合作项目管理
- `/api/resources/*` - 资源管理

#### 数据分析与可视化
- `/api/dashboard/*` - 仪表板数据
- `/api/analytics/*` - 数据分析
- `/api/knowledge-graph/*` - 知识图谱（Neo4j）
- `/api/search/*` - 全局搜索

#### 系统功能
- `/api/notifications/*` - 通知管理
- `/api/audit-logs/*` - 操作日志
- `/api/health` - 健康检查

完整 API 文档请访问: `http://localhost:8000/docs`

---

## 🧪 测试

### 后端测试

```bash
cd back

# 测试 Token 黑名单功能
python test_token_blacklist.py

# 测试 Redis 连接
python test_redis.py

# 测试 MongoDB 论文功能
python test_mongodb_papers.py

# 测试速率限制
python test_rate_limiter.py

# 测试审计日志
python test_audit_logs.py

# 测试分析缓存
python test_analytics_cache.py

# 测试 AI 报告生成
python test_ai_reports.py

# 验证所有数据库数据
python verify_all_data.py

# 验证数据库连接
python verify_databases.py
```

### 安全扫描

```bash
# 使用 Semgrep 扫描
docker run --rm -v //d/desk/Collect_Precious_Time_to_Fulfill_Dreams:/src semgrep/semgrep semgrep scan --config=auto /src
```

---

## 🛠️ 开发指南

### 代码规范

- Python: 遵循 PEP 8
- JavaScript: 使用 ESLint
- 提交信息: 遵循 Conventional Commits

### 分支策略

- `main`: 生产环境分支
- `develop`: 开发分支
- `feature/*`: 功能分支
- `bugfix/*`: 修复分支

### 提交前检查

```bash
# 代码格式化
black back/
isort back/

# 类型检查
mypy back/

# 安全扫描
semgrep scan --config=auto .

# 运行测试
pytest
```

---

## 📦 部署

### Docker 部署

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 生产环境部署

1. **配置环境变量**
   - 使用生产环境的数据库连接
   - 设置强 JWT 密钥
   - 配置 CORS 白名单

2. **启动服务**
   ```bash
   # 使用 Gunicorn + Uvicorn
   gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
   ```

3. **配置反向代理**
   - 使用 Nginx 作为反向代理
   - 配置 HTTPS
   - 设置速率限制

4. **监控和日志**
   - 配置日志收集
   - 设置性能监控
   - 配置告警

---

## 🐛 故障排除

### 常见问题

**Q: 启动时提示 "APP_JWT_SECRET_KEY environment variable must be set"**

A: 请确保已在 `back/.env` 文件中设置 `APP_JWT_SECRET_KEY`。使用以下命令生成密钥：
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```
然后将生成的密钥添加到 `back/.env` 文件中：
```
APP_JWT_SECRET_KEY=生成的密钥
```

**Q: 数据库连接失败**

A: 检查以下项：
1. 数据库服务是否启动
2. 连接字符串是否正确
3. 用户名和密码是否正确
4. 防火墙是否允许连接

**Q: Token 验证失败**

A: 确保：
1. JWT 密钥在所有服务实例中一致
2. Token 未过期
3. Token 未被加入黑名单

**Q: Redis 连接失败**

A: 检查：
1. Redis 服务是否启动：`redis-cli ping`
2. `.env` 中的 `APP_REDIS_ENABLED=true` 和 `APP_REDIS_DSN` 是否正确
3. 如果 Redis 未启用，某些功能将不可用：
   - Token 黑名单（登出功能）
   - 搜索历史
   - 验证码缓存
   - 分析数据缓存
   - 速率限制

---

## 📝 更新日志

### v1.0.0 (2025-11-28)

#### 🔒 安全更新
- ✅ 修复了 15 个 Semgrep 检测到的安全问题
- ✅ 实施了 JWT 密钥环境变量管理
- ✅ 修复了未验证的 JWT 解码问题
- ✅ 实施了 SQL 注入防护
- ✅ 修复了模板注入风险
- ✅ 改进了网络访问控制

#### ✨ 新功能
- 🎯 Token 黑名单机制
- 📊 完整的 API 文档
- 🔐 增强的安全配置

#### 📚 文档
- 📄 添加了 SECURITY_FIXES.md
- 📄 完善了 README.md
- 📄 提供了 .env.example 模板

---

## 🤝 贡献指南

欢迎贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 贡献要求

- 代码符合项目规范
- 添加必要的测试
- 更新相关文档
- 通过所有 CI 检查
- 通过安全扫描

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 👥 团队

- **项目负责人**: [Your Name]
- **后端开发**: [Backend Team]
- **前端开发**: [Frontend Team]
- **安全顾问**: [Security Team]

---

## 📧 联系方式

- **项目主页**: [GitHub Repository]
- **问题反馈**: [GitHub Issues]
- **邮箱**: [your-email@example.com]
- **文档**: [Documentation Site]

---

## 🙏 致谢

感谢以下开源项目：

- [FastAPI](https://fastapi.tiangolo.com/)
- [SQLAlchemy](https://www.sqlalchemy.org/)
- [React](https://reactjs.org/)
- [PostgreSQL](https://www.postgresql.org/)
- [Neo4j](https://neo4j.com/)
- [Redis](https://redis.io/)
- [Semgrep](https://semgrep.dev/)

---

## ⚠️ 免责声明

本项目仅供学习和研究使用。在生产环境使用前，请确保：

1. 进行充分的安全审计
2. 配置适当的备份策略
3. 遵守相关法律法规
4. 保护用户隐私和数据安全

---

<div align="center">

**珍惜时间，成就梦想** 🚀

Made with ❤️ by the Development Team

</div>

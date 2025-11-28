# 科研成果管理系统部署指南

## 📋 目录

- [系统概述](#系统概述)
- [环境要求](#环境要求)
- [快速启动](#快速启动)
- [数据库配置](#数据库配置)
- [系统初始化](#系统初始化)
- [数据库迁移](#数据库迁移)
- [服务启动](#服务启动)
- [常用命令](#常用命令)
- [故障排除](#故障排除)
- [生产环境部署](#生产环境部署)

## 🎯 系统概述

科研成果管理系统是一个基于 FastAPI + React 的全栈应用，支持多种数据库：
- **PostgreSQL**: 结构化数据存储
- **MongoDB**: 文档和元数据存储
- **Neo4j**: 知识图谱和关系分析
- **Redis**: 缓存和会话管理

## 🔧 环境要求

### 软件依赖

| 组件 | 版本要求 | 说明 |
|------|----------|------|
| Python | ≥3.9 (推荐3.11) | 后端运行环境 |
| Node.js | ≥16.0 | 前端构建环境 |
| PostgreSQL | ≥12.0 | 主数据库 |
| MongoDB | ≥4.4 | 文档存储 |
| Neo4j | ≥4.0 | 图数据库 |
| Redis | ≥6.0 | 缓存服务 |

### 系统要求

- **内存**: 最低 4GB，推荐 8GB+
- **存储**: 最低 10GB 可用空间
- **网络**: 需要访问外网下载依赖

## 🚀 快速启动

### 1. 克隆项目

```bash
git clone <repository-url>
cd React_Tailwind_FastAPI
```

### 2. 后端环境配置

```bash
cd back

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 复制环境配置
cp env.example .env
```

### 3. 前端环境配置

```bash
cd ../front

# 安装依赖
npm install
# 或使用 yarn
yarn install
```

## 🗄️ 数据库配置

### PostgreSQL 配置

1. **创建数据库**:
```sql
CREATE DATABASE research;
CREATE USER postgres WITH PASSWORD '123456';
GRANT ALL PRIVILEGES ON DATABASE research TO postgres;
```

2. **配置连接** (在 `.env` 中):
```env
APP_POSTGRES_ENABLED=true
APP_POSTGRES_DSN="postgresql+asyncpg://postgres:123456@localhost:5432/research"
APP_POSTGRES_ECHO=false
```

### MongoDB 配置

1. **启动 MongoDB 服务**:
```bash
# Windows (服务方式)
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
```

2. **配置连接** (在 `.env` 中):
```env
APP_MONGO_ENABLED=true
APP_MONGO_DSN="mongodb://localhost:27017"
APP_MONGO_DATABASE="research_platform"
```

### Neo4j 配置

1. **启动 Neo4j 服务**:
```bash
# 启动服务
neo4j start

# 设置初始密码
neo4j-admin set-initial-password 12345678
```

2. **配置连接** (在 `.env` 中):
```env
APP_NEO4J_ENABLED=true
APP_NEO4J_URI="bolt://localhost:7687"
APP_NEO4J_USER="neo4j"
APP_NEO4J_PASSWORD="12345678"
```

### Redis 配置

1. **启动 Redis 服务**:
```bash
# Windows
redis-server

# Linux/Mac
sudo systemctl start redis
```

2. **配置连接** (在 `.env` 中):
```env
APP_REDIS_ENABLED=true
APP_REDIS_DSN="redis://localhost:6379/0"
APP_REDIS_SSL=false
```

## 🔄 系统初始化

### 1. 验证数据库连接

```bash
cd back
python init_database.py
```

**输出示例**:
```
🚀 Starting database initialization for Research Achievement Management API
📍 Environment: development
🔍 Verifying database connections...
✅ PostgreSQL connection successful
✅ MongoDB connection successful
✅ Neo4j connection successful
✅ Redis connection successful
🎉 Database initialization completed successfully!
```

### 2. 创建数据库表

```bash
# 创建所有表
python init_database.py

# 删除所有表
python init_database.py --drop

# 重置数据库（删除后重建）
python init_database.py --reset

# 插入示例数据
python init_database.py --seed
```

## 📊 数据库迁移

### Alembic 迁移命令

```bash
cd back

# 初始化迁移环境（仅首次）
alembic init alembic

# 生成迁移文件
alembic revision --autogenerate -m "Initial migration"

# 查看迁移历史
alembic history

# 执行迁移
alembic upgrade head

# 回滚迁移
alembic downgrade -1

# 查看当前版本
alembic current

# 回滚到特定版本
alembic downgrade <revision_id>
```

### 迁移最佳实践

1. **生成迁移前检查**:
```bash
# 检查模型变更
alembic revision --autogenerate -m "描述变更内容" --dry-run
```

2. **备份数据库**:
```bash
# PostgreSQL 备份
pg_dump -U postgres -d research > backup.sql

# MongoDB 备份
mongodump --db research_platform --out backup/
```

3. **测试迁移**:
```bash
# 在测试环境先执行
alembic upgrade head
# 确认无误后在生产环境执行
```

## 🎮 服务启动

### 开发环境启动

**后端服务**:
```bash
cd back

# 方式1: 直接启动
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 方式2: 使用脚本
python -c "import uvicorn; uvicorn.run('app.main:app', reload=True, host='0.0.0.0', port=8000)"
```

**前端服务**:
```bash
cd front

# 开发模式启动
npm run dev
# 或
yarn dev

# 指定端口启动
npm run dev -- --port 5173
```

### 生产环境启动

**后端服务**:
```bash
cd back

# 使用 Gunicorn (推荐)
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# 使用 Uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

**前端构建**:
```bash
cd front

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 📝 常用命令

### 项目管理命令

```bash
# 查看项目结构
tree -I "node_modules|__pycache__|.git|venv"

# 检查代码质量
cd back
flake8 app/
black app/
isort app/

cd ../front
npm run lint
npm run type-check
```

### 数据库管理命令

```bash
# PostgreSQL 命令
psql -U postgres -d research -c "SELECT version();"
psql -U postgres -d research -c "\dt"  # 查看表

# MongoDB 命令
mongo research_platform --eval "db.stats()"
mongo research_platform --eval "show collections"

# Neo4j 命令
cypher-shell -u neo4j -p 12345678 "MATCH (n) RETURN count(n);"

# Redis 命令
redis-cli ping
redis-cli info
redis-cli flushall  # 清空所有数据
```

### 系统监控命令

```bash
# 查看服务状态
netstat -tlnp | grep :8000  # 后端服务
netstat -tlnp | grep :5173  # 前端服务

# 查看数据库连接
netstat -tlnp | grep :5432  # PostgreSQL
netstat -tlnp | grep :27017 # MongoDB
netstat -tlnp | grep :7687  # Neo4j
netstat -tlnp | grep :6379  # Redis

# 查看系统资源
htop
df -h
free -h
```

### 日志管理命令

```bash
# 查看应用日志
tail -f logs/app.log

# 查看数据库日志
# PostgreSQL
tail -f /var/log/postgresql/postgresql-*.log

# MongoDB
tail -f /var/log/mongodb/mongod.log

# Neo4j
tail -f /var/log/neo4j/neo4j.log

# Redis
tail -f /var/log/redis/redis-server.log
```

## 🔧 故障排除

### 常见问题及解决方案

#### 1. 数据库连接失败

**问题**: `Connection refused` 或 `Authentication failed`

**解决方案**:
```bash
# 检查服务状态
systemctl status postgresql
systemctl status mongod
systemctl status neo4j
systemctl status redis

# 检查端口占用
netstat -tlnp | grep 5432
netstat -tlnp | grep 27017
netstat -tlnp | grep 7687
netstat -tlnp | grep 6379

# 重启服务
sudo systemctl restart postgresql
sudo systemctl restart mongod
sudo systemctl restart neo4j
sudo systemctl restart redis
```

#### 2. Python 依赖问题

**问题**: `ModuleNotFoundError` 或版本冲突

**解决方案**:
```bash
# 重新创建虚拟环境
rm -rf venv
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或 venv\Scripts\activate  # Windows

# 升级 pip
pip install --upgrade pip

# 重新安装依赖
pip install -r requirements.txt

# 检查依赖版本
pip list
pip check
```

#### 3. 前端构建失败

**问题**: 构建或启动失败

**解决方案**:
```bash
# 清理缓存
npm cache clean --force
rm -rf node_modules package-lock.json

# 重新安装
npm install

# 检查 Node.js 版本
node --version
npm --version

# 使用 yarn 替代
npm install -g yarn
yarn install
```

#### 4. 端口冲突

**问题**: `Address already in use`

**解决方案**:
```bash
# 查找占用端口的进程
lsof -i :8000
lsof -i :5173

# 杀死进程
kill -9 <PID>

# 或使用不同端口
uvicorn app.main:app --port 8001
npm run dev -- --port 5174
```

## 🚀 生产环境部署

### 1. 服务器配置

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必要软件
sudo apt install -y python3 python3-pip python3-venv
sudo apt install -y nodejs npm
sudo apt install -y postgresql postgresql-contrib
sudo apt install -y mongodb
sudo apt install -y redis-server
sudo apt install -y nginx

# 安装 Neo4j
wget -O - https://debian.neo4j.com/neotechnology.gpg.key | sudo apt-key add -
echo 'deb https://debian.neo4j.com stable 4.4' | sudo tee /etc/apt/sources.list.d/neo4j.list
sudo apt update
sudo apt install neo4j
```

### 2. 应用部署

```bash
# 创建应用目录
sudo mkdir -p /opt/research-system
sudo chown $USER:$USER /opt/research-system
cd /opt/research-system

# 克隆代码
git clone <repository-url> .

# 后端部署
cd back
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn

# 前端构建
cd ../front
npm install
npm run build
```

### 3. 系统服务配置

**创建 systemd 服务文件**:

```bash
# 后端服务
sudo tee /etc/systemd/system/research-api.service > /dev/null <<EOF
[Unit]
Description=Research Achievement Management API
After=network.target

[Service]
Type=exec
User=www-data
Group=www-data
WorkingDirectory=/opt/research-system/back
Environment=PATH=/opt/research-system/back/venv/bin
ExecStart=/opt/research-system/back/venv/bin/gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 127.0.0.1:8000
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# 启用服务
sudo systemctl daemon-reload
sudo systemctl enable research-api
sudo systemctl start research-api
```

### 4. Nginx 配置

```bash
sudo tee /etc/nginx/sites-available/research-system > /dev/null <<EOF
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /opt/research-system/front/dist;
        try_files \$uri \$uri/ /index.html;
    }

    # API 代理
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# 启用站点
sudo ln -s /etc/nginx/sites-available/research-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. SSL 证书配置

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 6. 监控和日志

```bash
# 安装监控工具
sudo apt install htop iotop nethogs

# 配置日志轮转
sudo tee /etc/logrotate.d/research-system > /dev/null <<EOF
/opt/research-system/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload research-api
    endscript
}
EOF
```

## 📚 附录

### 环境变量说明

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `APP_ENVIRONMENT` | 运行环境 | `development`/`production` |
| `APP_POSTGRES_DSN` | PostgreSQL 连接串 | `postgresql+asyncpg://user:pass@host:5432/db` |
| `APP_MONGO_DSN` | MongoDB 连接串 | `mongodb://localhost:27017` |
| `APP_NEO4J_URI` | Neo4j 连接地址 | `bolt://localhost:7687` |
| `APP_REDIS_DSN` | Redis 连接串 | `redis://localhost:6379/0` |

### 性能优化建议

1. **数据库优化**:
   - 创建适当的索引
   - 定期执行 `VACUUM` 和 `ANALYZE`
   - 配置连接池大小

2. **缓存策略**:
   - 使用 Redis 缓存频繁查询的数据
   - 实现查询结果缓存
   - 配置静态资源缓存

3. **应用优化**:
   - 使用异步处理
   - 实现分页查询
   - 优化数据库查询

### 安全建议

1. **数据库安全**:
   - 使用强密码
   - 限制网络访问
   - 定期备份数据

2. **应用安全**:
   - 启用 HTTPS
   - 实现身份认证
   - 输入验证和过滤

3. **服务器安全**:
   - 定期更新系统
   - 配置防火墙
   - 监控异常访问

---

**文档版本**: v1.0  
**最后更新**: 2025-11-13  
**维护者**: Research Team

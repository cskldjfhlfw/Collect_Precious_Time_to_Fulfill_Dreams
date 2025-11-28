# 后端服务初始化指南

本目录包含科研成果管理系统后端（FastAPI）的基础项目结构以及多数据源连接配置示例，覆盖 PostgreSQL、Neo4j、MongoDB、Redis 四类数据存储，符合设计文档中的技术选型。

## 目录结构

```
back/
├── app/
│   ├── api/
│   │   └── routes/
│   │       └── health.py
│   ├── core/
│   │   ├── config.py
│   │   └── logging.py
│   ├── db/
│   │   ├── mongodb.py
│   │   ├── neo4j.py
│   │   ├── postgres.py
│   │   └── redis.py
│   └── main.py
├── env.example
└── requirements.txt
```

## 环境配置

1. 复制环境变量模板：
   ```bash
   cp env.example .env
   ```
2. 根据实际部署填写数据库/缓存等连接信息：
   - `APP_POSTGRES_DSN`：`postgresql+asyncpg://user:password@host:5432/database`
   - `APP_NEO4J_URI` / `APP_NEO4J_USER` / `APP_NEO4J_PASSWORD`
   - `APP_MONGO_DSN` / `APP_MONGO_DATABASE`
   - `APP_REDIS_DSN`
   - 将对应的 `*_ENABLED` 设置为 `true` 即可启用连接。

## 安装依赖

```bash
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

## 本地启动

```bash
uvicorn app.main:app --reload --port 8000
```

访问 `http://localhost:8000/api/health/` 可以查看各个后端服务连接状态；`http://localhost:8000/` 返回应用运行提示。

> 注意：若某个服务未启用或连接失败，会在健康检查中显示 `disabled` 或 `error` 状态。

## 后续开发建议

- 在 `app/api/routes/` 下继续补充业务相关的路由模块。
- 在 `app/db/` 中定义 SQLAlchemy ORM 模型、Neo4j 图谱操作、MongoDB 集合操作、Redis 缓存封装等。
- 引入依赖注入机制（如 `fastapi.Depends`）结合 `get_session()` 等方法，为路由提供数据访问层。


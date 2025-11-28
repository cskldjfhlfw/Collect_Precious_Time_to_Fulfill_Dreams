# 科研成果管理系统 API 文档

## 概述

本文档描述了科研成果管理系统后端API的所有接口。API基于FastAPI构建，提供RESTful风格的接口，支持JSON格式的数据交换。

**基础URL**: `http://localhost:8000/api`

**API版本**: v1

## 认证

目前API暂未实现认证机制，所有接口均可直接访问。

## 通用响应格式

### 分页响应
```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "size": 20,
  "pages": 5
}
```

### 统计响应
```json
{
  "label": "总论文数",
  "value": 42,
  "change": "+12",
  "trend": "up"
}
```

### 错误响应
```json
{
  "detail": "错误描述信息"
}
```

## API 接口

### 1. 健康检查

#### GET /health
检查服务和数据库连接状态。

**响应示例**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "services": {
    "postgres": "connected",
    "neo4j": "connected",
    "mongodb": "connected",
    "redis": "connected"
  }
}
```

---

### 2. 仪表盘

#### GET /dashboard/overview
获取仪表盘概览数据，包含各模块统计和趋势数据。

**响应示例**:
```json
{
  "research_overview": [
    {"label": "论文", "value": 42, "change": "+12", "trend": "up"},
    {"label": "专利", "value": 15, "change": "+5", "trend": "up"}
  ],
  "trend_data": [
    {"month": "2024-01", "papers": 8, "patents": 2, "projects": 1}
  ],
  "achievement_stats": {
    "papers": {"current": 35, "target": 100, "completion": 75},
    "patents": {"current": 12, "target": 20, "completion": 60}
  }
}
```

#### GET /dashboard/recent-achievements
获取最新成果动态。

**查询参数**:
- `limit` (int, 可选): 返回数量限制，默认10

**响应示例**:
```json
[
  {
    "id": "uuid",
    "type": "paper",
    "title": "论文标题",
    "status": "published",
    "date": "2024-01-01T00:00:00Z",
    "description": "论文 - Nature"
  }
]
```

---

### 3. 论文管理

#### GET /papers
获取论文列表，支持分页和筛选。

**查询参数**:
- `page` (int, 可选): 页码，默认1
- `size` (int, 可选): 每页大小，默认20
- `status` (string, 可选): 状态筛选 (draft/reviewing/published)
- `search` (string, 可选): 搜索关键词

**响应**: 分页的论文列表

#### GET /papers/stats
获取论文统计数据。

**响应示例**:
```json
[
  {"label": "总论文数", "value": 42, "change": "+12", "trend": "up"},
  {"label": "已发表", "value": 35, "change": "+8", "trend": "up"},
  {"label": "审稿中", "value": 5, "change": "+3", "trend": "up"},
  {"label": "撰写中", "value": 2, "change": "+1", "trend": "up"}
]
```

#### GET /papers/authors/contributions
获取作者贡献统计。

**查询参数**:
- `limit` (int, 可选): 返回作者数量，默认10

**响应示例**:
```json
[
  {
    "author_name": "张三",
    "paper_count": 15,
    "contribution_percent": 85
  }
]
```

#### GET /papers/{paper_id}
获取论文详情。

**路径参数**:
- `paper_id` (UUID): 论文ID

#### POST /papers
创建新论文。

**请求体**:
```json
{
  "title": "论文标题",
  "authors": {"first_author": "张三", "co_authors": ["李四", "王五"]},
  "journal": "Nature",
  "status": "draft",
  "abstract": "摘要内容",
  "keywords": ["关键词1", "关键词2"]
}
```

#### PUT /papers/{paper_id}
更新论文信息。

#### DELETE /papers/{paper_id}
删除论文。

---

### 4. 专利管理

#### GET /patents
获取专利列表。

**查询参数**:
- `page`, `size`: 分页参数
- `status` (string, 可选): 状态筛选
- `technology_field` (string, 可选): 技术领域筛选

#### GET /patents/stats
获取专利统计数据。

**响应示例**:
```json
[
  {"label": "总专利数", "value": 15, "change": "+5", "trend": "up"},
  {"label": "已授权", "value": 12, "change": "+3", "trend": "up"},
  {"label": "申请中", "value": 2, "change": "+2", "trend": "up"},
  {"label": "维护中", "value": 1, "change": "0", "trend": "stable"}
]
```

#### GET /patents/maintenance-reminders
获取维护提醒列表。

**查询参数**:
- `days_ahead` (int, 可选): 提前天数，默认30

#### GET /patents/{patent_id}
获取专利详情。

#### POST /patents
创建新专利。

**请求体**:
```json
{
  "name": "专利名称",
  "patent_number": "CN123456789A",
  "patent_type": "发明专利",
  "status": "draft",
  "technology_field": "人工智能",
  "inventors": {"primary": "张三", "co_inventors": ["李四"]}
}
```

#### PUT /patents/{patent_id}
更新专利信息。

#### DELETE /patents/{patent_id}
删除专利。

---

### 5. 项目管理

#### GET /projects
获取项目列表。

**查询参数**:
- `page`, `size`: 分页参数
- `status` (string, 可选): 状态筛选
- `priority` (string, 可选): 优先级筛选
- `project_type` (string, 可选): 项目类型筛选

#### GET /projects/stats
获取项目统计数据。

**响应示例**:
```json
[
  {"label": "总项目数", "value": 8, "change": "+3", "trend": "up"},
  {"label": "进行中", "value": 5, "change": "+2", "trend": "up"},
  {"label": "已完成", "value": 2, "change": "+1", "trend": "up"},
  {"label": "规划中", "value": 1, "change": "0", "trend": "stable"}
]
```

#### GET /projects/budget-summary
获取预算汇总信息。

**响应示例**:
```json
{
  "total_budget": 1000000.0,
  "total_used": 650000.0,
  "usage_rate": 65.0
}
```

#### GET /projects/{project_id}/milestones
获取项目里程碑列表。

#### GET /projects/{project_id}
获取项目详情。

#### POST /projects
创建新项目。

**请求体**:
```json
{
  "name": "项目名称",
  "project_number": "PROJ2024001",
  "project_type": "国家自然科学基金",
  "principal": "张三",
  "budget": 500000.0,
  "start_date": "2024-01-01",
  "end_date": "2026-12-31",
  "status": "planning",
  "priority": "high"
}
```

#### PUT /projects/{project_id}
更新项目信息。

#### DELETE /projects/{project_id}
删除项目。

---

### 6. 资源管理

#### GET /resources
获取资源列表。

**查询参数**:
- `page`, `size`: 分页参数
- `resource_type` (string, 可选): 资源类型筛选
- `is_public` (boolean, 可选): 公开/私有筛选

#### GET /resources/stats
获取资源统计数据。

**响应示例**:
```json
{
  "overview": [
    {"label": "总资源数", "value": 25, "change": "+8", "trend": "up"},
    {"label": "公开资源", "value": 20, "change": "+5", "trend": "up"},
    {"label": "私有资源", "value": 5, "change": "+3", "trend": "up"}
  ],
  "by_type": {
    "数据集": 10,
    "软件工具": 8,
    "文档资料": 7
  }
}
```

#### GET /resources/maintenance-due
获取需要维护的资源。

**查询参数**:
- `days_ahead` (int, 可选): 提前天数，默认7

#### GET /resources/{resource_id}/usage-logs
获取资源使用记录。

#### POST /resources/{resource_id}/download
记录资源下载（更新下载计数）。

#### GET /resources/{resource_id}
获取资源详情。

#### POST /resources
创建新资源。

**请求体**:
```json
{
  "name": "资源名称",
  "resource_type": "数据集",
  "description": "资源描述",
  "version": "v1.0",
  "maintainer": "张三",
  "is_public": true,
  "tags": ["机器学习", "数据挖掘"]
}
```

#### PUT /resources/{resource_id}
更新资源信息。

#### DELETE /resources/{resource_id}
删除资源。

---

## 数据模型

### 论文 (Paper)
```json
{
  "id": "uuid",
  "title": "论文标题",
  "authors": {"first_author": "张三", "co_authors": ["李四"]},
  "journal": "期刊名称",
  "conference": "会议名称",
  "publish_date": "2024-01-01",
  "doi": "10.1000/182",
  "impact_factor": 5.2,
  "citation_count": 15,
  "writing_progress": 85,
  "status": "published",
  "abstract": "摘要内容",
  "keywords": ["关键词1", "关键词2"],
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### 专利 (Patent)
```json
{
  "id": "uuid",
  "name": "专利名称",
  "patent_number": "CN123456789A",
  "application_date": "2024-01-01",
  "authorization_date": "2024-06-01",
  "patent_type": "发明专利",
  "status": "authorized",
  "technology_field": "人工智能",
  "commercialization_value": 1000000.0,
  "maintenance_deadline": "2034-01-01",
  "inventors": {"primary": "张三", "co_inventors": ["李四"]},
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### 项目 (Project)
```json
{
  "id": "uuid",
  "name": "项目名称",
  "project_number": "PROJ2024001",
  "project_type": "国家自然科学基金",
  "principal": "张三",
  "start_date": "2024-01-01",
  "end_date": "2026-12-31",
  "budget": 500000.0,
  "budget_used": 200000.0,
  "status": "active",
  "progress_percent": 40,
  "priority": "high",
  "risk_level": "low",
  "description": "项目描述",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### 资源 (Resource)
```json
{
  "id": "uuid",
  "name": "资源名称",
  "resource_type": "数据集",
  "description": "资源描述",
  "version": "v1.0",
  "maintainer": "张三",
  "maintenance_cycle_days": 90,
  "next_maintenance_date": "2024-04-01",
  "license": "MIT",
  "download_count": 150,
  "usage_rate": 85.5,
  "is_public": true,
  "tags": ["机器学习", "数据挖掘"],
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

## 状态码

- `200` - 请求成功
- `201` - 创建成功
- `400` - 请求参数错误
- `404` - 资源不存在
- `422` - 数据验证错误
- `500` - 服务器内部错误

## 使用示例

### 获取论文列表
```bash
curl -X GET "http://localhost:8000/api/papers?page=1&size=10&status=published"
```

### 创建新论文
```bash
curl -X POST "http://localhost:8000/api/papers" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "基于深度学习的图像识别研究",
    "authors": {"first_author": "张三", "co_authors": ["李四", "王五"]},
    "journal": "计算机学报",
    "status": "draft"
  }'
```

### 获取仪表盘概览
```bash
curl -X GET "http://localhost:8000/api/dashboard/overview"
```

## 开发说明

1. **环境要求**: Python 3.11+, PostgreSQL, Redis (可选)
2. **安装依赖**: `pip install -r requirements.txt`
3. **数据库初始化**: `python -m app.db.init_db`
4. **启动服务**: `uvicorn app.main:app --reload`
5. **API文档**: 访问 `http://localhost:8000/docs` 查看交互式文档

## 更新日志

- **v1.0.0** (2024-01-01): 初始版本，实现核心CRUD功能
  - 论文、专利、项目、资源管理
  - 仪表盘统计和概览
  - 分页、筛选、搜索功能

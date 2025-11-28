# 缺失的后端API接口文档

## 概述
以下是前端已集成但后端尚未实现的API接口。这些接口目前返回空数据或使用placeholder实现。

## 1. 比赛管理 API (Competitions)

### 基础路径: `/api/competitions`

#### 获取比赛列表
```http
GET /api/competitions
```

**查询参数:**
- `page` (int): 页码，默认1
- `size` (int): 每页数量，默认10
- `status` (string): 状态筛选 (进行中|已结束|待报名)
- `search` (string): 搜索关键词

**响应格式:**
```json
{
  "items": [
    {
      "id": 1,
      "name": "中国国际大学生创新大赛",
      "category": "创新创业",
      "status": "进行中",
      "level": "国家级",
      "team": "智能推荐系统团队",
      "members": ["张三", "李四", "王五"],
      "registration_date": "2024-02-15",
      "submission_deadline": "2024-05-30",
      "final_date": "2024-08-15",
      "award": null,
      "progress": 65,
      "description": "比赛描述",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "size": 10,
  "pages": 10
}
```

#### 获取比赛统计
```http
GET /api/competitions/stats
```

**响应格式:**
```json
[
  {
    "label": "总参赛数",
    "value": 24,
    "change": "+6",
    "trend": "up"
  },
  {
    "label": "获奖数量", 
    "value": 15,
    "change": "+4",
    "trend": "up"
  },
  {
    "label": "进行中",
    "value": 8,
    "change": "+2", 
    "trend": "up"
  },
  {
    "label": "待报名",
    "value": 3,
    "change": "+1",
    "trend": "up"
  }
]
```

## 2. 会议管理 API (Conferences)

### 基础路径: `/api/conferences`

#### 获取会议列表
```http
GET /api/conferences
```

**查询参数:**
- `page` (int): 页码，默认1
- `size` (int): 每页数量，默认10
- `status` (string): 状态筛选 (即将参加|已参加|待申请)
- `search` (string): 搜索关键词

**响应格式:**
```json
{
  "items": [
    {
      "id": 1,
      "name": "国际人工智能大会",
      "location": "上海国际会议中心",
      "start_date": "2024-06-15",
      "end_date": "2024-06-18",
      "status": "即将参加",
      "submission_status": "已接收",
      "participants": ["张三", "李四"],
      "budget": 15000,
      "used": 8500,
      "category": "国际会议",
      "paper_title": "基于深度学习的智能推荐系统",
      "description": "会议描述",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "size": 10,
  "pages": 10
}
```

#### 获取会议统计
```http
GET /api/conferences/stats
```

**响应格式:**
```json
[
  {
    "label": "总会议数",
    "value": 18,
    "change": "+3",
    "trend": "up"
  },
  {
    "label": "已参加",
    "value": 12,
    "change": "+2",
    "trend": "up"
  },
  {
    "label": "计划中",
    "value": 4,
    "change": "+1",
    "trend": "up"
  },
  {
    "label": "已结束",
    "value": 2,
    "change": "0",
    "trend": "stable"
  }
]
```

## 3. 合作管理 API (Cooperations)

### 基础路径: `/api/cooperations`

#### 获取合作列表
```http
GET /api/cooperations
```

**查询参数:**
- `page` (int): 页码，默认1
- `size` (int): 每页数量，默认10
- `status` (string): 状态筛选 (活跃合作|洽谈中|暂停|终止)
- `search` (string): 搜索关键词

**响应格式:**
```json
{
  "items": [
    {
      "id": 1,
      "name": "华为技术有限公司",
      "type": "企业合作",
      "location": "深圳",
      "status": "活跃合作",
      "projects": 3,
      "contact_person": "李经理",
      "email": "li.manager@huawei.com",
      "phone": "138-0000-1234",
      "established_date": "2022-06-15",
      "last_contact": "2024-03-20",
      "value": "高",
      "field": "人工智能",
      "description": "合作描述",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "size": 10,
  "pages": 10
}
```

#### 获取合作统计
```http
GET /api/cooperations/stats
```

**响应格式:**
```json
[
  {
    "label": "总合作数",
    "value": 28,
    "change": "+4",
    "trend": "up"
  },
  {
    "label": "进行中",
    "value": 15,
    "change": "+3",
    "trend": "up"
  },
  {
    "label": "已完成",
    "value": 12,
    "change": "+5",
    "trend": "up"
  },
  {
    "label": "计划中",
    "value": 1,
    "change": "0",
    "trend": "stable"
  }
]
```

## 4. 软件著作权 API (Software Copyrights)

### 基础路径: `/api/software-copyrights`

#### 获取软著列表
```http
GET /api/software-copyrights
```

**查询参数:**
- `page` (int): 页码，默认1
- `size` (int): 每页数量，默认10
- `status` (string): 状态筛选 (已登记|申请中|待更新)
- `search` (string): 搜索关键词

**响应格式:**
```json
{
  "items": [
    {
      "id": 1,
      "name": "智能推荐系统软件",
      "version": "V2.1",
      "registration_number": "2024SR0123456",
      "status": "已登记",
      "application_date": "2023-08-15",
      "approval_date": "2023-10-20",
      "developer": "张三",
      "category": "应用软件",
      "language": "Python",
      "description": "软著描述",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "size": 10,
  "pages": 10
}
```

#### 获取软著统计
```http
GET /api/software-copyrights/stats
```

**响应格式:**
```json
[
  {
    "label": "总软著数",
    "value": 23,
    "change": "+3",
    "trend": "up"
  },
  {
    "label": "已登记",
    "value": 18,
    "change": "+2",
    "trend": "up"
  },
  {
    "label": "申请中",
    "value": 4,
    "change": "+1",
    "trend": "up"
  },
  {
    "label": "待更新",
    "value": 1,
    "change": "0",
    "trend": "stable"
  }
]
```

## 5. 搜索 API (Search)

### 基础路径: `/api/search`

#### 全局搜索
```http
GET /api/search
```

**查询参数:**
- `q` (string): 搜索关键词，必需
- `type` (string): 搜索类型 (papers|projects|patents|resources|all)
- `page` (int): 页码，默认1
- `size` (int): 每页数量，默认10

**响应格式:**
```json
{
  "results": [
    {
      "id": 1,
      "title": "基于深度学习的智能推荐系统研究",
      "type": "paper",
      "category": "papers",
      "description": "研究描述...",
      "author": "张三",
      "date": "2024-03-15",
      "relevance": 95,
      "url": "/papers/1"
    }
  ],
  "total": 100,
  "page": 1,
  "size": 10,
  "pages": 10,
  "query": "智能推荐",
  "search_time": 0.05
}
```

## 6. 知识图谱 API (Knowledge Graph)

### 基础路径: `/api/knowledge-graph`

#### 获取图谱数据
```http
GET /api/knowledge-graph/nodes
```

**查询参数:**
- `type` (string): 节点类型筛选
- `limit` (int): 返回数量限制

**响应格式:**
```json
{
  "nodes": [
    {
      "id": "paper_1",
      "label": "基于深度学习的智能推荐系统",
      "type": "paper",
      "properties": {
        "author": "张三",
        "year": 2024,
        "citations": 15
      }
    }
  ],
  "edges": [
    {
      "source": "author_1",
      "target": "paper_1", 
      "relationship": "authored",
      "weight": 1.0
    }
  ],
  "stats": {
    "total_nodes": 1247,
    "total_edges": 3521,
    "node_types": {
      "papers": 156,
      "authors": 89,
      "projects": 32
    }
  }
}
```

#### 获取关系分析
```http
GET /api/knowledge-graph/relationships
```

**响应格式:**
```json
{
  "key_relationships": [
    {
      "source": "张三",
      "target": "智能推荐系统项目",
      "relationship": "项目负责人",
      "strength": 95,
      "type": "人员-项目"
    }
  ],
  "domains": [
    {
      "name": "人工智能",
      "entities": 45,
      "connections": 128,
      "growth": "+15%"
    }
  ]
}
```

## 7. 统计分析 API (Analytics)

### 基础路径: `/api/analytics`

#### 获取综合统计
```http
GET /api/analytics/overview
```

**响应格式:**
```json
{
  "summary": {
    "total_papers": 156,
    "total_projects": 32,
    "total_patents": 45,
    "total_resources": 89
  },
  "trends": [
    {
      "period": "2024-01",
      "papers": 12,
      "projects": 3,
      "patents": 2
    }
  ],
  "top_authors": [
    {
      "name": "张三",
      "papers": 15,
      "projects": 5,
      "h_index": 12
    }
  ]
}
```

## 实施建议

### 优先级
1. **高优先级**: 软件著作权API - 前端已完全集成
2. **中优先级**: 比赛、会议、合作API - 有完整的UI界面
3. **低优先级**: 搜索、知识图谱、统计分析API - 功能性增强

### 数据库设计
每个API对应的数据表应包含：
- 基础字段: `id`, `created_at`, `updated_at`
- 业务字段: 根据上述API响应格式设计
- 索引: 在搜索字段和外键上建立索引

### 认证授权
所有API应实现：
- JWT token认证
- 基于角色的访问控制
- API限流和日志记录

### 错误处理
统一的错误响应格式：
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数验证失败",
    "details": {
      "field": "name",
      "message": "名称不能为空"
    }
  }
}
```

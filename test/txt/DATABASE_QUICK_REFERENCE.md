# 数据库快速参考表

## 📊 所有表一览

| 序号 | 表名 | 中文名 | 主要用途 | 记录数量参考 |
|------|------|--------|----------|------------|
| 1 | users | 用户表 | 用户账户管理 | ~100 |
| 2 | papers | 论文表 | 学术论文管理 | ~1000 |
| 3 | patents | 专利表 | 专利申请管理 | ~500 |
| 4 | projects | 项目表 | 科研项目管理 | ~200 |
| 5 | software_copyrights | 软著表 | 软件著作权管理 | ~300 |
| 6 | competitions | 竞赛表 | 学科竞赛管理 | ~150 |
| 7 | conferences | 会议表 | 学术会议管理 | ~100 |
| 8 | cooperations | 合作表 | 机构合作管理 | ~80 |
| 9 | resources | 资源表 | 科研资源管理 | ~500 |
| 10 | relationships | 关系表 | 通用关系存储 | ~2000 |
| 11 | resource_achievements | 资源成果关联 | 资源与成果关联 | ~1000 |
| 12 | paper_authors | 论文作者 | 论文作者关系 | ~3000 |
| 13 | project_milestones | 项目里程碑 | 项目节点管理 | ~600 |
| 14 | tags | 标签表 | 统一标签管理 | ~200 |
| 15 | achievement_tags | 成果标签关联 | 标签与成果关联 | ~5000 |
| 16 | reminders | 提醒表 | 智能提醒管理 | ~800 |
| 17 | resource_usage_logs | 资源使用日志 | 使用历史记录 | ~10000 |
| 18 | resource_maintenance_tasks | 资源维护任务 | 维护计划管理 | ~400 |
| 19 | search_saved_views | 保存的视图 | 搜索条件保存 | ~150 |

**总计**: 19张表

---

## 🔑 主要外键关系

```
users (用户表)
  ├─→ papers.created_by
  ├─→ patents.created_by
  ├─→ projects.created_by
  ├─→ software_copyrights.created_by
  ├─→ competitions.created_by
  ├─→ conferences.created_by
  ├─→ cooperations.created_by
  ├─→ resources.created_by
  ├─→ reminders.created_by
  ├─→ paper_authors.author_id
  └─→ resource_usage_logs.user_id

papers
  └─→ paper_authors.paper_id

projects
  └─→ project_milestones.project_id

resources
  ├─→ resource_achievements.resource_id
  ├─→ resource_usage_logs.resource_id
  └─→ resource_maintenance_tasks.resource_id

tags
  └─→ achievement_tags.tag_id
```

---

## 📝 常用状态值

### 论文状态 (papers.status)
| 值 | 说明 | 颜色标识 |
|----|------|---------|
| draft | 草稿 | 灰色 |
| submitted | 已投稿 | 蓝色 |
| accepted | 已接收 | 黄色 |
| published | 已发表 | 绿色 |

### 专利状态 (patents.status)
| 值 | 说明 | 颜色标识 |
|----|------|---------|
| draft | 草稿 | 灰色 |
| pending | 申请中 | 蓝色 |
| approved | 已授权 | 绿色 |
| rejected | 已驳回 | 红色 |

### 项目状态 (projects.status)
| 值 | 说明 | 颜色标识 |
|----|------|---------|
| planning | 规划中 | 灰色 |
| ongoing | 进行中 | 蓝色 |
| completed | 已完成 | 绿色 |
| suspended | 已暂停 | 橙色 |

### 合作状态 (cooperations.status)
| 值 | 说明 | 颜色标识 |
|----|------|---------|
| negotiating | 洽谈中 | 黄色 |
| active | 进行中 | 绿色 |
| completed | 已完成 | 蓝色 |
| terminated | 已终止 | 红色 |

---

## 🏷️ 类型枚举值

### 专利类型 (patents.patent_type)
- `invention` - 发明专利
- `utility` - 实用新型专利
- `design` - 外观设计专利

### 项目类型 (projects.project_type)
- `national` - 国家级项目
- `provincial` - 省部级项目
- `enterprise` - 企业合作项目

### 竞赛级别 (competitions.level)
- `international` - 国际级
- `national` - 国家级
- `provincial` - 省级
- `school` - 校级

### 会议级别 (conferences.level)
- `international` - 国际会议
- `national` - 国内会议
- `regional` - 区域会议

### 资源类型 (resources.resource_type)
- `dataset` - 数据集
- `tool` - 工具软件
- `equipment` - 设备仪器
- `document` - 文档资料

### 合作类型 (cooperations.cooperation_type)
- `research` - 科研合作
- `education` - 教育合作
- `industry` - 产业合作

---

## 🎯 常用查询SQL

### 1. 查询用户的所有成果统计
```sql
SELECT 
  (SELECT COUNT(*) FROM papers WHERE created_by = <user_id>) as papers_count,
  (SELECT COUNT(*) FROM patents WHERE created_by = <user_id>) as patents_count,
  (SELECT COUNT(*) FROM projects WHERE created_by = <user_id>) as projects_count;
```

### 2. 查询论文及其所有作者
```sql
SELECT p.*, json_agg(pa.*) as authors
FROM papers p
LEFT JOIN paper_authors pa ON p.id = pa.paper_id
WHERE p.id = <paper_id>
GROUP BY p.id;
```

### 3. 查询项目进度
```sql
SELECT 
  p.*,
  COUNT(pm.id) as milestone_count,
  SUM(CASE WHEN pm.status = 'completed' THEN 1 ELSE 0 END) as completed_milestones
FROM projects p
LEFT JOIN project_milestones pm ON p.id = pm.project_id
WHERE p.id = <project_id>
GROUP BY p.id;
```

### 4. 查询即将到期的提醒
```sql
SELECT * FROM reminders
WHERE reminder_date <= CURRENT_DATE + INTERVAL '7 days'
  AND status = 'pending'
ORDER BY reminder_date ASC;
```

### 5. 查询热门标签
```sql
SELECT t.name, COUNT(at.id) as usage_count
FROM tags t
LEFT JOIN achievement_tags at ON t.id = at.tag_id
GROUP BY t.id, t.name
ORDER BY usage_count DESC
LIMIT 10;
```

### 6. 查询资源使用统计
```sql
SELECT 
  r.name,
  r.download_count,
  COUNT(rul.id) as usage_log_count,
  SUM(rul.quantity) as total_quantity
FROM resources r
LEFT JOIN resource_usage_logs rul ON r.id = rul.resource_id
WHERE r.id = <resource_id>
GROUP BY r.id, r.name, r.download_count;
```

---

## 💡 最佳实践

### 1. 分页查询
```sql
SELECT * FROM papers
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;  -- 第一页
```

### 2. 全文搜索（PostgreSQL）
```sql
SELECT * FROM papers
WHERE to_tsvector('english', title || ' ' || COALESCE(abstract, ''))
  @@ to_tsquery('english', 'machine learning');
```

### 3. JSON查询
```sql
-- 查询包含特定作者的论文
SELECT * FROM papers
WHERE authors @> '[{"name": "张三"}]'::jsonb;
```

### 4. 数组查询
```sql
-- 查询包含特定关键词的论文
SELECT * FROM papers
WHERE 'machine learning' = ANY(keywords);
```

### 5. 聚合统计
```sql
-- 按年份统计论文数量
SELECT 
  EXTRACT(YEAR FROM publish_date) as year,
  COUNT(*) as count
FROM papers
WHERE publish_date IS NOT NULL
GROUP BY year
ORDER BY year DESC;
```

---

## 🔒 数据安全

### 需要加密的字段
- `users.password_hash` - 使用bcrypt或argon2
- `users.email` - 敏感个人信息
- `cooperations.contact_email` - 联系人邮箱
- `cooperations.contact_phone` - 联系人电话

### 访问控制
- 使用`created_by`字段实现数据隔离
- 管理员可查看所有数据
- 普通用户只能查看自己创建的数据

---

## 📈 性能优化建议

### 1. 添加索引
```sql
-- 常用查询字段索引
CREATE INDEX idx_papers_status ON papers(status);
CREATE INDEX idx_papers_created_by ON papers(created_by);
CREATE INDEX idx_papers_publish_date ON papers(publish_date);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_reminders_date_status ON reminders(reminder_date, status);
```

### 2. 使用复合索引
```sql
CREATE INDEX idx_achievement_tags_lookup 
ON achievement_tags(achievement_type, achievement_id);
```

### 3. JSONB索引
```sql
CREATE INDEX idx_papers_authors_gin ON papers USING GIN(authors);
CREATE INDEX idx_search_filters_gin ON search_saved_views USING GIN(filters);
```

---

## 🛠️ 维护操作

### 清理过期数据
```sql
-- 删除90天前完成的提醒
DELETE FROM reminders
WHERE status = 'completed'
  AND updated_at < CURRENT_DATE - INTERVAL '90 days';
```

### 更新统计信息
```sql
ANALYZE papers;
ANALYZE projects;
ANALYZE resources;
```

### 检查表大小
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

**更新日期**: 2024-11-15  
**文档版本**: v1.0

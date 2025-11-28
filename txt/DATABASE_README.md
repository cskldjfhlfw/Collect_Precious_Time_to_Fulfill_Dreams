# 数据库文档索引

## 📚 文档概览

本目录包含科研成果管理系统的完整数据库文档，帮助您快速了解和使用系统数据库。

---

## 📖 文档列表

### 1. [DATABASE_DOCUMENTATION.md](DATABASE_DOCUMENTATION.md)
**完整数据库说明文档** - 主要文档

**包含内容**:
- ✅ 系统概述和技术栈
- ✅ 完整的数据库架构图
- ✅ 19张表的详细结构说明
- ✅ 实体关系图
- ✅ 使用指南和最佳实践
- ✅ JSONB字段使用示例
- ✅ 数据库迁移和备份说明

**适合**:
- 新加入团队的开发者
- 需要深入了解数据库设计的人员
- 数据库管理员

---

### 2. [DATABASE_QUICK_REFERENCE.md](DATABASE_QUICK_REFERENCE.md)
**快速参考手册** - 日常使用

**包含内容**:
- ✅ 所有表快速索引
- ✅ 外键关系图
- ✅ 状态和类型枚举值
- ✅ 常用SQL查询示例
- ✅ 性能优化建议
- ✅ 维护操作指南

**适合**:
- 日常开发查询
- 快速查找表结构
- SQL语句参考

---

## 🗂️ 数据库统计

| 项目 | 数量 |
|------|------|
| **总表数** | 19 |
| **核心成果表** | 7 |
| **辅助功能表** | 12 |
| **主要外键** | 20+ |
| **JSONB字段** | 15+ |

---

## 🏗️ 数据库架构速览

```
┌─────────────────────────────────────────┐
│   科研成果管理系统数据库 (PostgreSQL)    │
└─────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
    ┌───▼───┐  ┌───▼───┐  ┌───▼───┐
    │ 核心  │  │ 资源  │  │ 辅助  │
    │ 成果  │  │ 管理  │  │ 功能  │
    └───┬───┘  └───┬───┘  └───┬───┘
        │          │          │
    ┌───▼──────────▼──────────▼───┐
    │                              │
    │  Neo4j (知识图谱)             │
    │  MongoDB (文档存储)           │
    │  Redis (缓存)                │
    │                              │
    └──────────────────────────────┘
```

---

## 🚀 快速开始

### 查看完整文档
```bash
# Windows
start DATABASE_DOCUMENTATION.md

# Linux/Mac
xdg-open DATABASE_DOCUMENTATION.md
```

### 查看快速参考
```bash
start DATABASE_QUICK_REFERENCE.md
```

### 连接数据库
```bash
# PostgreSQL
psql -U postgres -d research

# 或使用图形工具
# DBeaver, pgAdmin, DataGrip等
```

---

## 📊 核心表速查

| 表名 | 记录类型 | 主要用途 |
|------|----------|----------|
| `papers` | 论文 | 学术论文管理 |
| `patents` | 专利 | 专利申请追踪 |
| `projects` | 项目 | 科研项目管理 |
| `software_copyrights` | 软著 | 软件著作权 |
| `competitions` | 竞赛 | 学科竞赛记录 |
| `conferences` | 会议 | 学术会议参与 |
| `cooperations` | 合作 | 机构合作CRM |

---

## 🔧 常用操作

### 查询示例

**统计所有成果**:
```sql
SELECT 
  (SELECT COUNT(*) FROM papers) as papers,
  (SELECT COUNT(*) FROM patents) as patents,
  (SELECT COUNT(*) FROM projects) as projects,
  (SELECT COUNT(*) FROM software_copyrights) as software,
  (SELECT COUNT(*) FROM competitions) as competitions,
  (SELECT COUNT(*) FROM conferences) as conferences,
  (SELECT COUNT(*) FROM cooperations) as cooperations;
```

**查询用户的论文**:
```sql
SELECT * FROM papers 
WHERE created_by = '<user_id>'
ORDER BY created_at DESC
LIMIT 10;
```

**查询即将到期的任务**:
```sql
SELECT * FROM reminders
WHERE reminder_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
  AND status = 'pending'
ORDER BY reminder_date;
```

---

## 🎯 使用场景

### 场景1: 新功能开发
1. 查看 `DATABASE_DOCUMENTATION.md` 了解相关表结构
2. 参考 `DATABASE_QUICK_REFERENCE.md` 中的SQL示例
3. 在 `app/models/tables.py` 中查看ORM定义

### 场景2: 数据查询
1. 直接查看 `DATABASE_QUICK_REFERENCE.md`
2. 找到对应的SQL示例
3. 根据需要修改查询条件

### 场景3: 性能优化
1. 参考 `DATABASE_QUICK_REFERENCE.md` 的性能优化章节
2. 添加必要的索引
3. 优化查询语句

---

## 📞 技术支持

### 文档问题
- 如发现文档错误或过时，请及时更新
- 文档位置: `DATABASE_DOCUMENTATION.md` 和 `DATABASE_QUICK_REFERENCE.md`

### 数据库问题
- 检查数据库连接配置: `back/.env`
- 查看ORM模型定义: `back/app/models/tables.py`
- 数据库迁移文件: `back/alembic/versions/`

---

## 🔄 文档更新

### 何时更新
- ✅ 新增表或字段
- ✅ 修改表结构
- ✅ 添加新的索引
- ✅ 改变状态枚举值
- ✅ 新增外键关系

### 如何更新
1. 修改 `DATABASE_DOCUMENTATION.md` 的相应章节
2. 更新 `DATABASE_QUICK_REFERENCE.md` 的快速参考
3. 更新本文件的统计数据
4. 提交变更记录

---

## 📝 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2024-11-15 | 初始版本，包含19张表的完整文档 |

---

## 💡 提示

- 📖 建议先阅读完整文档，了解整体架构
- 🔍 日常开发可直接查看快速参考
- 📊 使用数据库图形工具查看ER图
- 🔒 注意数据安全和访问控制
- ⚡ 关注性能优化建议

---

**文档维护者**: 开发团队  
**最后更新**: 2024-11-15  
**文档版本**: v1.0

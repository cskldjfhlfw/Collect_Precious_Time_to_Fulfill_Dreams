# Excel批量导入指南

## 📋 文档说明

本文档提供Excel批量导入数据的完整指南和模板示例。

---

## 📁 相关文件

1. **DATABASE_FIELDS_LIST.md** - 完整字段清单（包含格式说明）
2. **DATABASE_FIELDS_SIMPLE.txt** - 纯文本字段列表（便于复制）

---

## 🎯 使用步骤

### 步骤1: 选择要导入的表

从以下核心表中选择：
- `papers` - 论文
- `patents` - 专利
- `projects` - 项目
- `software_copyrights` - 软著
- `competitions` - 竞赛
- `conferences` - 会议
- `cooperations` - 合作

### 步骤2: 创建Excel模板

1. 打开 `DATABASE_FIELDS_SIMPLE.txt`
2. 复制对应表的字段行（逗号分隔）
3. 粘贴到Excel第一行作为表头

### 步骤3: 填充数据

按照下方示例填充数据行

---

## 📊 Excel模板示例

### 示例1: papers (论文) 模板

**Excel第一行（表头）**:
```
title	journal	publish_date	doi	status	abstract	keywords	created_by
```

**示例数据行**:
```
基于深度学习的图像识别研究	计算机学报	2024-03-15	10.1234/abc	published	本文研究...	机器学习,深度学习	user-uuid-here
一种新型算法的设计与实现	软件学报	2024-06-20	10.5678/def	accepted	提出了...	算法,优化	user-uuid-here
```

### 示例2: patents (专利) 模板

**Excel第一行**:
```
name	patent_number	patent_type	application_date	status	technology_field	created_by
```

**示例数据行**:
```
一种智能识别装置	ZL2024012345	invention	2024-01-10	pending	人工智能	user-uuid-here
数据处理系统	ZL2024023456	utility	2024-02-15	approved	大数据	user-uuid-here
```

### 示例3: projects (项目) 模板

**Excel第一行**:
```
name	project_number	project_type	principal	start_date	end_date	budget	status	progress_percent	created_by
```

**示例数据行**:
```
智慧城市关键技术研究	2024-001	national	张三	2024-01-01	2026-12-31	5000000	ongoing	35	user-uuid-here
企业数字化转型项目	2024-002	enterprise	李四	2024-03-01	2025-03-01	800000	ongoing	60	user-uuid-here
```

---

## 🔧 字段填写规则

### 通用规则

1. **必填字段** - 不能为空
2. **日期格式** - 统一使用 `YYYY-MM-DD`
3. **数字格式** - 不带逗号分隔符
4. **布尔值** - 使用 `TRUE` 或 `FALSE`
5. **UUID字段** - 如 `created_by`，需填写有效的用户UUID

### 特殊字段

#### JSONB字段 (authors, inventors等)
```
格式: [{"name":"张三","affiliation":"XX大学"}]
或留空，系统会自动处理
```

#### ARRAY字段 (keywords, tags)
```
格式: 机器学习,深度学习,人工智能
使用英文逗号分隔
```

#### 状态字段
```
papers.status: draft | submitted | accepted | published
patents.status: draft | pending | approved | rejected
projects.status: planning | ongoing | completed | suspended
```

---

## 📝 各表必填字段清单

| 表名 | 必填字段 |
|------|---------|
| papers | title, status |
| patents | name, patent_number, patent_type |
| projects | name, project_number, project_type |
| software_copyrights | name, registration_number |
| competitions | name, level |
| conferences | name |
| cooperations | organization |
| resources | name, resource_type |
| users | username, email, password_hash |

---

## 💡 导入建议

### 简化版模板（推荐新手）

只包含必填字段和常用字段：

**papers 简化版**:
```
title	status	journal	publish_date	abstract
```

**projects 简化版**:
```
name	project_number	project_type	principal	status	progress_percent
```

### 完整版模板（高级用户）

包含所有字段，参考 `DATABASE_FIELDS_SIMPLE.txt`

---

## 🚀 快速开始示例

### 导入5篇论文示例

**Excel内容**:

| title | status | journal | publish_date | abstract |
|-------|--------|---------|--------------|----------|
| 机器学习在医疗诊断中的应用 | published | 中国科学 | 2024-01-15 | 研究了机器学习... |
| 深度学习算法优化研究 | accepted | 计算机研究与发展 | 2024-02-20 | 提出了一种新的... |
| 神经网络压缩技术综述 | submitted | 软件学报 | 2024-03-10 | 综述了近年来... |
| 强化学习在游戏AI中的应用 | published | 自动化学报 | 2024-04-05 | 探讨了强化学习... |
| 迁移学习最新进展 | draft | | | 正在撰写中... |

### 导入3个项目示例

**Excel内容**:

| name | project_number | project_type | principal | status | progress_percent |
|------|---------------|--------------|-----------|--------|-----------------|
| 智能制造平台开发 | 2024-N-001 | national | 王教授 | ongoing | 45 |
| 数据分析系统建设 | 2024-P-002 | provincial | 李主任 | ongoing | 70 |
| 企业信息化改造 | 2024-E-003 | enterprise | 张经理 | planning | 10 |

---

## ⚠️ 注意事项

### 1. 数据验证

导入前请确保：
- ✅ 所有必填字段已填写
- ✅ 日期格式正确
- ✅ 状态值在允许范围内
- ✅ 数字类型字段不含非数字字符
- ✅ UUID格式有效

### 2. 字符编码

- 使用 **UTF-8** 编码
- Excel另存为时选择 "CSV UTF-8"

### 3. 数据量建议

- 单次导入建议不超过1000条
- 大批量数据分批导入
- 定期备份数据库

### 4. 外键关系

- `created_by` 需要填写有效的用户UUID
- `paper_id`, `project_id` 等需要引用已存在的记录

---

## 🔄 导入后检查

```sql
-- 检查导入的论文数量
SELECT COUNT(*) FROM papers 
WHERE created_at > '2024-11-15';

-- 检查状态分布
SELECT status, COUNT(*) 
FROM papers 
GROUP BY status;

-- 检查是否有空值
SELECT COUNT(*) FROM papers 
WHERE title IS NULL OR status IS NULL;
```

---

## 📞 技术支持

### 常见问题

**Q: 日期格式错误怎么办？**  
A: 统一使用 `YYYY-MM-DD` 格式，如 `2024-11-15`

**Q: 如何填写JSONB字段？**  
A: 可以暂时留空，导入后再通过界面编辑

**Q: UUID从哪里获取？**  
A: 从用户表查询或使用系统生成的UUID

**Q: 导入失败如何处理？**  
A: 检查错误日志，修正数据后重新导入

---

## 📚 相关文档

- `DATABASE_FIELDS_LIST.md` - 完整字段清单
- `DATABASE_FIELDS_SIMPLE.txt` - 纯文本字段列表  
- `DATABASE_DOCUMENTATION.md` - 完整数据库文档
- `DATABASE_QUICK_REFERENCE.md` - 快速参考手册

---

**最后更新**: 2024-11-15  
**文档版本**: v1.0

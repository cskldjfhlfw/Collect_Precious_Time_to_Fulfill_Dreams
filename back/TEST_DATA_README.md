# 测试数据生成说明

本目录包含多个数据库的测试数据生成脚本，用于快速填充开发和测试环境的数据。

## 脚本说明

### 1. `generate_multi_db_data.py` - 基础多数据库测试数据生成器

**功能：** 为所有数据库生成基础测试数据

**包含数据：**

#### PostgreSQL
- ✅ 用户 (User) - 4个测试用户

#### Neo4j  
- ✅ 研究人员节点 (Researcher) - 4个研究人员
- ✅ 研究领域节点 (Field) - 6个研究领域
- ✅ 项目节点 (Project) - 3个项目
- ✅ 机构节点 (Institution) - 4个机构
- ✅ 会议节点 (Conference) - 3个会议
- ✅ 各种关系 (专长、合作、参会、归属等)

#### MongoDB
- ✅ papers - 论文文档
- ✅ datasets - 研究数据集
- ✅ experiments - 实验记录
- ✅ conference_materials - 会议资料
- ✅ cooperation_documents - 合作项目文档
- ✅ patent_documents - 专利详细文档
- ✅ resource_usage_logs - 资源使用日志

#### Redis
- ✅ 用户会话数据
- ✅ 系统统计数据
- ✅ 热门搜索关键词
- ✅ 最近活动记录
- ✅ 研究人员排行榜
- ✅ 项目进度缓存
- ✅ 通知队列
- ✅ API速率限制
- ✅ 热门论文排行
- ✅ 在线用户集合
- ✅ 会议日程缓存

**运行方式：**
```bash
python generate_multi_db_data.py
```

### 2. `generate_extended_test_data.py` - PostgreSQL扩展测试数据生成器

**功能：** 为PostgreSQL数据库生成完整的业务数据

**包含数据：**
- ✅ 标签 (Tag) - 9个标签
- ✅ 论文 (Paper) - 3篇论文
- ✅ 专利 (Patent) - 3个专利
- ✅ 软件著作权 (SoftwareCopyright) - 3个软著
- ✅ 项目 (Project) - 3个项目
- ✅ 竞赛 (Competition) - 3个竞赛记录
- ✅ **会议 (Conference) - 3个会议记录**
- ✅ **合作 (Cooperation) - 3个合作记录**
- ✅ 资源 (Resource) - 3个资源记录

**运行方式：**
```bash
python generate_extended_test_data.py
```

## 使用流程

### 完整初始化流程

1. **初始化数据库表结构**
   ```bash
   python init_database.py --reset
   ```

2. **生成基础多数据库测试数据**
   ```bash
   python generate_multi_db_data.py
   ```

3. **生成PostgreSQL扩展数据（可选）**
   ```bash
   python generate_extended_test_data.py
   ```

### 单独重置某个数据库

**仅重置PostgreSQL：**
```bash
# 删除并重建表
python init_database.py --drop
python init_database.py

# 生成测试数据
python generate_extended_test_data.py
```

**仅重置Neo4j：**
```python
# Neo4j会在generate_multi_db_data.py执行时自动清空数据
python generate_multi_db_data.py
```

## 数据特点

### 会议合作相关数据 🎯

本次更新**特别增强了会议和合作相关的测试数据**：

#### Conference (会议表)
包含3个会议记录：
- 2023国际人工智能大会 (IJCAI 2023) - CCF A类
- 2023中国区块链技术与应用峰会 (CBTAS 2023) - 国家级
- 第十届中国自然语言处理学术会议 (CCL 2023) - CCF B类

每条记录包含：
- 会议基本信息（名称、地点、时间）
- 会议级别和类型
- 参会形式（oral/poster）
- 发表论文标题
- 报告人信息

#### Cooperation (合作表)
包含3个合作记录：
- 校企合作 - 智能制造联合实验室（与华为）
- 国际合作 - 中美区块链技术联合研究（与MIT）
- 产学研合作 - 智能语音技术应用（与科大讯飞）

每条记录包含：
- 合作基本信息
- 合作类型和内容
- 资金金额
- 联系人和状态
- 已取得的成果

#### MongoDB 会议资料集合
存储会议的详细资料：
- 演示文稿URL
- 视频录像URL
- Q&A总结
- 参会人数和反馈评分

#### MongoDB 合作文档集合
存储合作项目的文档：
- 合作协议
- 技术方案
- 进度报告
- 会议记录

#### Neo4j 会议和机构关系
图数据库中的关系网络：
- 研究人员参加会议 (ATTENDED)
- 机构间合作关系 (COOPERATES_WITH)
- 研究人员归属机构 (AFFILIATED_WITH)

## 测试账号

| 用户名 | 邮箱 | 角色 | 密码 |
|--------|------|------|------|
| admin | admin@research.edu | admin | (需要设置) |
| zhang_wei | zhang.wei@research.edu | researcher | (需要设置) |
| li_ming | li.ming@research.edu | researcher | (需要设置) |
| wang_fang | wang.fang@research.edu | student | (需要设置) |

> 注意：密码哈希为测试用的dummy值，实际使用时需要通过API设置真实密码。

## 数据一致性

脚本确保了跨数据库的数据一致性：

- **相同的研究人员名字** 在PostgreSQL、Neo4j和MongoDB中保持一致
- **相同的项目名称** 在PostgreSQL和Neo4j中保持一致
- **相同的会议信息** 在PostgreSQL、Neo4j和MongoDB中保持一致
- **关联关系正确** 通过ID映射确保跨表引用正确

## 数据验证

运行脚本后会自动验证数据：

```
🔍 验证生成的数据...
📊 PostgreSQL: 4 个用户
🕸️  Neo4j: 20+ 个节点
🍃 MongoDB: 2 篇论文, 2 个数据集, 1 个实验
           2 个会议资料, 2 个合作文档, 1 个专利文档, 2 条资源日志
🔴 Redis: 30+ 个键值对
```

## 环境要求

1. 所有数据库服务正常运行
2. 配置文件 `.env` 正确设置
3. Python依赖已安装：
   ```bash
   pip install sqlalchemy asyncpg motor neo4j redis
   ```

## 注意事项

⚠️ **这些脚本会清空现有数据！**

- `generate_multi_db_data.py` 会清空Neo4j的所有数据
- `init_database.py --reset` 会删除PostgreSQL的所有表

⚠️ **不要在生产环境运行这些脚本！**

这些脚本仅用于开发和测试环境。

## 故障排除

### 连接失败
```
❌ PostgreSQL connection failed: ...
```
**解决方案：** 检查数据库服务是否启动，配置是否正确。

### 数据插入失败
```
❌ 生成失败: ...
```
**解决方案：** 
1. 确保表结构已创建 (`python init_database.py`)
2. 检查外键约束是否满足
3. 查看完整错误信息

### UUID相关错误
**解决方案：** 确保PostgreSQL已启用uuid-ossp扩展：
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

## 扩展建议

如需添加更多测试数据，建议：

1. 在 `generate_extended_test_data.py` 中添加更多记录
2. 保持数据的真实性和一致性
3. 更新本README文档

## 更新日志

- **2024-11-14**: 大幅扩展测试数据生成
  - 增强Neo4j节点和关系类型
  - 添加MongoDB多个新集合
  - 扩展Redis缓存类型
  - **重点添加会议(Conference)和合作(Cooperation)相关数据**
  - 创建独立的PostgreSQL扩展数据生成器

- **Initial**: 基础多数据库测试数据生成器

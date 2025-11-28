# 批量导入功能 - 快速实施指南

## ✅ 已完成

### 1. 核心组件
- ✅ `ImportDialog` 组件已创建 (`front/components/import-dialog.tsx`)
- ✅ 论文页面已集成批量导入功能

### 2. 示例数据生成
- ✅ 9张表的示例数据生成脚本 (`generate_sample_data.py`)
- ✅ 所有CSV文件已生成在 `lists/` 目录

## 🔧 安装依赖

**重要**: 必须先安装依赖才能使用批量导入功能

```bash
cd front
npm install papaparse
npm install --save-dev @types/papaparse
```

## 📋 为其他页面添加导入功能

### 通用模板

在任意页面文件中：

**1. 导入组件**
```typescript
import { ImportDialog } from "@/components/import-dialog"
```

**2. 添加到页面（在"新增"按钮旁边）**
```typescript
<ImportDialog
  entityType="表名"
  entityName="中文名"
  apiEndpoint="/api/端点"
  onImportSuccess={() => {
    refetch() // 或对应的刷新函数
  }}
  sampleFields={["字段1", "字段2", "字段3"]}
/>
```

---

## 🎯 各页面具体实施

### 2. 专利页面 (patents/page.tsx)

```typescript
// 1. 导入组件
import { ImportDialog } from "@/components/import-dialog"

// 2. 在页面操作按钮区添加（找到"新增专利"按钮附近）
<ImportDialog
  entityType="patents"
  entityName="专利"
  apiEndpoint="/api/patents"
  onImportSuccess={() => {
    refetchPatents() // 使用页面对应的刷新函数
  }}
  sampleFields={[
    "name",
    "patent_number",
    "application_date",
    "authorization_date",
    "patent_type",
    "status",
    "technology_field",
    "commercialization_value",
    "maintenance_deadline",
    "inventors",
    "related_projects",
    "image_path",
    "file_path"
  ]}
/>
```

### 3. 项目页面 (projects/page.tsx)

```typescript
import { ImportDialog } from "@/components/import-dialog"

<ImportDialog
  entityType="projects"
  entityName="项目"
  apiEndpoint="/api/projects"
  onImportSuccess={() => {
    refetchProjects()
  }}
  sampleFields={[
    "name",
    "project_number",
    "project_type",
    "principal",
    "start_date",
    "end_date",
    "budget",
    "budget_used",
    "status",
    "progress_percent",
    "priority",
    "risk_level",
    "description",
    "image_path"
  ]}
/>
```

### 4. 软著页面 (software-copyrights/page.tsx)

```typescript
import { ImportDialog } from "@/components/import-dialog"

<ImportDialog
  entityType="software_copyrights"
  entityName="软件著作权"
  apiEndpoint="/api/software-copyrights"
  onImportSuccess={() => {
    refetchSoftware()
  }}
  sampleFields={[
    "name",
    "registration_number",
    "registration_date",
    "version",
    "status",
    "development_language",
    "category",
    "latest_update",
    "maintenance_contact",
    "developers",
    "image_path",
    "file_path"
  ]}
/>
```

### 5. 竞赛页面 (competitions/page.tsx)

```typescript
import { ImportDialog } from "@/components/import-dialog"

<ImportDialog
  entityType="competitions"
  entityName="竞赛"
  apiEndpoint="/api/competitions"
  onImportSuccess={() => {
    refetchCompetitions()
  }}
  sampleFields={[
    "name",
    "level",
    "award_level",
    "award_date",
    "registration_deadline",
    "submission_deadline",
    "progress_percent",
    "mentor",
    "team_members",
    "status",
    "image_path",
    "file_path"
  ]}
/>
```

### 6. 会议页面 (conferences/page.tsx)

```typescript
import { ImportDialog } from "@/components/import-dialog"

<ImportDialog
  entityType="conferences"
  entityName="会议"
  apiEndpoint="/api/conferences"
  onImportSuccess={() => {
    refetchConferences()
  }}
  sampleFields={[
    "name",
    "level",
    "location",
    "start_date",
    "end_date",
    "participation_type",
    "submission_status",
    "travel_budget",
    "travel_expense",
    "visa_required",
    "reminder_date",
    "participants",
    "description",
    "image_path",
    "file_path"
  ]}
/>
```

### 7. 合作页面 (cooperations/page.tsx)

```typescript
import { ImportDialog } from "@/components/import-dialog"

<ImportDialog
  entityType="cooperations"
  entityName="合作"
  apiEndpoint="/api/cooperations"
  onImportSuccess={() => {
    refetchCooperations()
  }}
  sampleFields={[
    "organization",
    "content",
    "start_date",
    "end_date",
    "cooperation_type",
    "status",
    "cooperation_value",
    "pipeline_stage",
    "contact_person",
    "contact_email",
    "contact_phone",
    "next_follow_up",
    "image_path",
    "file_path"
  ]}
/>
```

### 8. 资源页面 (resources/page.tsx)

```typescript
import { ImportDialog } from "@/components/import-dialog"

<ImportDialog
  entityType="resources"
  entityName="资源"
  apiEndpoint="/api/resources"
  onImportSuccess={() => {
    refetchResources()
  }}
  sampleFields={[
    "name",
    "resource_type",
    "description",
    "version",
    "maintainer",
    "maintenance_cycle_days",
    "next_maintenance_date",
    "license",
    "download_count",
    "usage_rate",
    "image_path",
    "file_path",
    "external_url",
    "tags",
    "is_public"
  ]}
/>
```

---

## 📝 实施步骤

### 步骤1: 安装依赖（必须）
```bash
cd front
npm install papaparse @types/papaparse
```

### 步骤2: 为每个页面添加导入功能
1. 打开对应的页面文件
2. 添加import语句
3. 在"新增"按钮附近添加`<ImportDialog />`组件
4. 确保`onImportSuccess`调用正确的刷新函数

### 步骤3: 测试
1. 重启前端: `npm run dev`
2. 打开任意页面
3. 点击"批量导入"按钮
4. 选择对应的CSV文件（在`lists/`目录）
5. 点击"开始导入"

---

## 💡 使用技巧

### 1. 找到正确的刷新函数

每个页面的刷新函数名可能不同，常见的有：
- `refetch()`
- `refetchPapers()`
- `refetchPatents()`
- `refetchProjects()`
- 等等...

**查找方法**:
在页面文件中搜索 `usePaginatedApi` 或 `useApi`，找到返回的刷新函数名。

### 2. 确定正确的API端点

查看页面中的API调用，通常在：
```typescript
const { ... } = usePaginatedApi(
  (params) => xxxApi.getList(params), // 这里的xxxApi对应/api/xxx
  { size: 10 }
)
```

### 3. CSV文件准备

使用生成的示例数据：
```bash
python generate_sample_data.py
```

生成的文件在 `lists/` 目录：
- lists/papers.csv
- lists/patents.csv
- lists/projects.csv
- 等等...

---

## ⚠️ 注意事项

### 1. 必填字段
确保CSV文件包含所有必填字段：
- papers: title, status
- patents: name, patent_number, patent_type
- projects: name, project_number, project_type
- 等等...

### 2. JSON字段格式
某些字段需要JSON格式（如authors, inventors等）：
```json
[{"name":"张三","affiliation":"清华大学"}]
```

### 3. 日期格式
统一使用: `YYYY-MM-DD`
例如: `2024-11-15`

### 4. 批量导入限制
- 建议单次不超过500条
- 大批量数据分批导入
- 导入前先测试少量数据

---

## 🐛 常见问题

### Q: TypeScript错误提示找不到papaparse
**A**: 需要安装依赖：
```bash
npm install papaparse @types/papaparse
```

### Q: 导入失败提示网络错误
**A**: 确保后端服务已启动 (localhost:8000)

### Q: 部分数据导入失败
**A**: 
- 查看错误提示中的具体信息
- 检查必填字段是否完整
- 验证数据格式是否正确

### Q: CSV解析失败
**A**:
- 确保文件编码为UTF-8
- 检查CSV格式是否正确（逗号分隔）

---

## 📚 相关文档

- `IMPORT_FEATURE_SETUP.md` - 详细设置指南
- `DATABASE_FIELDS_LIST.md` - 完整字段清单
- `EXCEL_IMPORT_GUIDE.md` - Excel导入指南
- `generate_sample_data.py` - 示例数据生成脚本

---

**最后更新**: 2024-11-15  
**版本**: v1.0  
**状态**: ✅ 论文页面已完成，其他页面待实施

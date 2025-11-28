# 批量导入功能设置指南

## 📦 安装依赖

```bash
cd front
npm install papaparse
npm install --save-dev @types/papaparse
```

## 🎯 已添加的组件

### ImportDialog 组件
位置: `front/components/import-dialog.tsx`

**功能特性**:
- ✅ CSV文件上传
- ✅ 文件解析和验证
- ✅ 批量导入到后端API
- ✅ 实时进度和结果反馈
- ✅ 错误处理和提示
- ✅ 模板下载功能

## 📋 使用方法

### 在任意页面中使用

```typescript
import { ImportDialog } from "@/components/import-dialog"

// 在页面的操作按钮区域添加
<ImportDialog
  entityType="papers"
  entityName="论文"
  apiEndpoint="/api/papers"
  onImportSuccess={() => {
    // 导入成功后刷新列表
    fetchData()
  }}
  sampleFields={["title", "authors", "journal", "status", "abstract"]}
/>
```

## 🔧 各页面集成示例

### 1. 论文页面 (papers/page.tsx)
```typescript
<ImportDialog
  entityType="papers"
  entityName="论文"
  apiEndpoint="/api/papers"
  onImportSuccess={fetchPapers}
  sampleFields={["title", "authors", "journal", "conference", "publish_date", "doi", "status", "abstract", "keywords"]}
/>
```

### 2. 专利页面 (patents/page.tsx)
```typescript
<ImportDialog
  entityType="patents"
  entityName="专利"
  apiEndpoint="/api/patents"
  onImportSuccess={fetchPatents}
  sampleFields={["name", "patent_number", "patent_type", "application_date", "status", "technology_field"]}
/>
```

### 3. 项目页面 (projects/page.tsx)
```typescript
<ImportDialog
  entityType="projects"
  entityName="项目"
  apiEndpoint="/api/projects"
  onImportSuccess={fetchProjects}
  sampleFields={["name", "project_number", "project_type", "principal", "start_date", "end_date", "status", "budget"]}
/>
```

### 4. 软著页面 (software-copyrights/page.tsx)
```typescript
<ImportDialog
  entityType="software_copyrights"
  entityName="软件著作权"
  apiEndpoint="/api/software-copyrights"
  onImportSuccess={fetchSoftware}
  sampleFields={["name", "registration_number", "registration_date", "version", "status", "development_language"]}
/>
```

### 5. 竞赛页面 (competitions/page.tsx)
```typescript
<ImportDialog
  entityType="competitions"
  entityName="竞赛"
  apiEndpoint="/api/competitions"
  onImportSuccess={fetchCompetitions}
  sampleFields={["name", "level", "award_level", "award_date", "status", "mentor"]}
/>
```

### 6. 会议页面 (conferences/page.tsx)
```typescript
<ImportDialog
  entityType="conferences"
  entityName="会议"
  apiEndpoint="/api/conferences"
  onImportSuccess={fetchConferences}
  sampleFields={["name", "level", "location", "start_date", "end_date", "participation_type"]}
/>
```

### 7. 合作页面 (cooperations/page.tsx)
```typescript
<ImportDialog
  entityType="cooperations"
  entityName="合作"
  apiEndpoint="/api/cooperations"
  onImportSuccess={fetchCooperations}
  sampleFields={["organization", "cooperation_type", "start_date", "end_date", "status", "contact_person", "contact_email"]}
/>
```

### 8. 资源页面 (resources/page.tsx)
```typescript
<ImportDialog
  entityType="resources"
  entityName="资源"
  apiEndpoint="/api/resources"
  onImportSuccess={fetchResources}
  sampleFields={["name", "resource_type", "description", "version", "maintainer", "license"]}
/>
```

## 📄 CSV文件格式

### 示例: 论文数据 (papers.csv)
```csv
title,authors,journal,status,abstract
基于深度学习的图像识别研究,"[{""name"":""张三"",""affiliation"":""清华大学""}]",计算机学报,published,这是摘要...
机器学习在医疗中的应用,"[{""name"":""李四"",""affiliation"":""北京大学""}]",软件学报,accepted,这是摘要...
```

### 注意事项
1. **编码**: 必须使用UTF-8编码
2. **JSON字段**: authors, inventors等字段需要使用JSON格式
3. **日期格式**: 统一使用 YYYY-MM-DD
4. **必填字段**: 确保必填字段不为空

## 🚀 快速开始

### 步骤1: 安装依赖
```bash
cd front
npm install papaparse @types/papaparse
```

### 步骤2: 运行示例数据生成脚本
```bash
cd ..
python generate_sample_data.py
```

### 步骤3: 在页面中添加导入按钮
参考上面的集成示例，在相应页面添加 `<ImportDialog />` 组件

### 步骤4: 测试导入
1. 打开对应页面
2. 点击"批量导入"按钮
3. 选择生成的CSV文件（在 `lists/` 目录）
4. 点击"开始导入"
5. 查看导入结果

## ⚠️ 常见问题

### Q1: 导入失败显示"网络错误"
**解决**: 确保后端服务已启动 (localhost:8000)

### Q2: CSV解析失败
**解决**: 
- 检查文件编码是否为UTF-8
- 确保CSV格式正确（使用逗号分隔）

### Q3: 部分数据导入失败
**解决**:
- 查看错误提示中的具体信息
- 检查必填字段是否完整
- 验证数据格式是否符合要求

### Q4: JSON字段格式错误
**解决**:
- authors等字段必须是有效的JSON格式
- 使用双引号，不要使用单引号
- 示例: `[{"name":"张三","affiliation":"清华大学"}]`

## 📊 批量导入最佳实践

1. **小批量测试**: 先导入少量数据测试
2. **数据验证**: 导入前验证数据格式
3. **备份数据**: 大批量导入前备份数据库
4. **分批导入**: 单次建议不超过500条
5. **错误处理**: 记录失败记录，修正后重新导入

## 🔗 相关文档

- `DATABASE_FIELDS_LIST.md` - 完整字段清单
- `EXCEL_IMPORT_GUIDE.md` - Excel导入指南
- `generate_sample_data.py` - 示例数据生成脚本
- `lists/` - 生成的示例CSV文件

---

**更新时间**: 2024-11-15
**版本**: v1.0

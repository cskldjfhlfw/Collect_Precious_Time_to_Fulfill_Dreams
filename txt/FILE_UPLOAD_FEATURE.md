# 论文文件上传功能说明

## 功能概述

系统已升级为自动文件上传模式，用户不再需要手动输入本地文件路径，而是通过文件选择器上传文件到服务器。

## 核心特性

### 1. 自动文件上传
- **图片上传**：支持 JPG, PNG, GIF, BMP, WebP, SVG 等格式
- **文档上传**：支持 PDF, DOC, DOCX 格式
- **即时上传**：选择文件后立即上传到服务器
- **路径自动保存**：上传成功后自动填充文件路径到表单

### 2. 文件命名规则
文件上传后会自动重命名，避免文件名冲突：
```
格式：原文件名_时间戳.扩展名
示例：research_paper_20251127_161430_123.pdf
```

时间戳格式：`YYYYMMDD_HHMMSS_fff`（精确到毫秒）

### 3. 文件存储结构
```
back/
└── uploads/
    ├── images/          # 论文封面图片
    │   └── paper1_20251127_161430_123.png
    └── documents/       # 论文原文文件
        └── research_20251127_161430_456.pdf
```

## 后端实现

### API接口

#### 文件上传接口
```
POST /api/papers/upload-file?file_type={image|document}
```

**请求参数**：
- `file`: 文件（multipart/form-data）
- `file_type`: 文件类型（query参数）
  - `image`: 图片文件
  - `document`: 文档文件

**响应示例**：
```json
{
  "success": true,
  "file_path": "uploads/images/paper1_20251127_161430_123.png",
  "original_filename": "paper1.png",
  "new_filename": "paper1_20251127_161430_123.png",
  "file_type": "image",
  "message": "文件上传成功"
}
```

### 文件访问

#### 图片访问
```
GET /api/papers/{paper_id}/image
```
- 支持相对路径（uploads文件夹）
- 支持绝对路径（兼容旧数据）
- 自动设置正确的Content-Type

#### 文件下载
```
GET /api/papers/{paper_id}/download
```
- 自动识别文件类型（PDF/Word）
- 响应头包含文件类型信息（X-File-Type）
- 支持相对路径和绝对路径

## 前端实现

### 文件选择器

#### 编辑/新增对话框
```tsx
<Input
  type="file"
  accept="image/*"  // 或 ".pdf,.doc,.docx"
  onChange={async (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const result = await papersApi.uploadFile(file, 'image')
      setForm({ ...form, imagePath: result.file_path })
    }
  }}
/>
```

### API调用
```typescript
// 上传图片
const result = await papersApi.uploadFile(file, 'image')

// 上传文档
const result = await papersApi.uploadFile(file, 'document')

// 返回值
{
  file_path: "uploads/images/paper1_20251127_161430_123.png",
  new_filename: "paper1_20251127_161430_123.png"
}
```

## 使用流程

### 创建论文
1. 点击"新增论文"按钮
2. 填写论文基本信息
3. 点击"封面图片"文件选择器
4. 选择图片文件 → 自动上传 → 显示上传成功提示
5. 点击"原文文件"文件选择器
6. 选择PDF/Word文件 → 自动上传 → 显示上传成功提示
7. 点击"创建"保存论文信息

### 编辑论文
1. 在论文列表中选择论文
2. 点击"编辑"按钮
3. 如需更换文件，点击相应的文件选择器
4. 选择新文件 → 自动上传 → 覆盖原路径
5. 点击"保存"更新论文信息

### 查看和下载
1. 在详情视图中自动显示封面图片
2. 点击"下载PDF文件"或"下载Word文件"按钮
3. 系统自动识别文件类型并下载

## 安全特性

### 文件验证
- **扩展名检查**：只允许指定格式的文件
- **文件类型验证**：验证file_type参数
- **路径安全**：防止路径遍历攻击

### 权限控制
- 文件上传需要管理员权限
- 使用JWT token认证

### 文件大小限制
建议在nginx或FastAPI配置中设置：
```python
# FastAPI配置示例
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    max_upload_size=10 * 1024 * 1024  # 10MB
)
```

## 数据库存储

### 路径格式
数据库中存储相对路径：
```sql
image_path: "uploads/images/paper1_20251127_161430_123.png"
file_path: "uploads/documents/research_20251127_161430_456.pdf"
```

### 兼容性
系统同时支持：
- ✅ 相对路径（新上传的文件）
- ✅ 绝对路径（历史数据兼容）

## 优势

### 用户体验
1. **简化操作**：不需要手动输入路径
2. **即时反馈**：上传成功立即显示
3. **错误提示**：上传失败显示具体原因
4. **文件预览**：显示已上传的文件路径

### 系统管理
1. **集中存储**：所有文件统一管理
2. **避免冲突**：时间戳命名防止重复
3. **易于备份**：uploads文件夹统一备份
4. **跨平台**：不依赖本地文件系统

### 安全性
1. **权限控制**：需要管理员权限
2. **格式验证**：只允许特定文件类型
3. **路径隔离**：文件存储在指定目录

## 注意事项

1. **文件大小**：建议限制单个文件不超过10MB
2. **存储空间**：定期清理未使用的文件
3. **备份策略**：定期备份uploads文件夹
4. **权限设置**：确保uploads文件夹有写入权限

## 迁移指南

### 从旧版本迁移
如果你有使用绝对路径的历史数据：
1. 系统会自动兼容绝对路径
2. 新上传的文件使用相对路径
3. 建议逐步迁移旧文件到uploads文件夹

### 批量迁移脚本
```python
# 示例：将旧文件迁移到uploads文件夹
import shutil
from pathlib import Path

def migrate_files():
    papers = get_all_papers()
    for paper in papers:
        if paper.image_path and Path(paper.image_path).is_absolute():
            # 复制文件到uploads文件夹
            new_path = copy_to_uploads(paper.image_path, 'images')
            # 更新数据库
            update_paper_image_path(paper.id, new_path)
```

## 文件位置

- 后端API：`back/app/api/routes/papers.py`
- 前端API：`front/lib/api.ts`
- 页面组件：`front/app/(dashboard)/papers/page.tsx`
- 上传目录：`back/uploads/`
- 说明文档：`FILE_UPLOAD_FEATURE.md`

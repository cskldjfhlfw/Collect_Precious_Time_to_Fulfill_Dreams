# 论文图片显示和文件下载功能实现

## 功能概述

为论文详情视图添加了以下功能：
1. **图片预览**：显示论文介绍图片，支持本地路径
2. **文件下载**：提供下载论文PDF/Word文件的功能，带确认对话框
3. **按需加载**：只在详情视图中加载完整信息，避免列表加载时的流量开销
4. **图片压缩显示**：自动限制图片最大高度为500px，保持宽高比

## 数据库字段

数据库表 `papers` 已包含以下字段：
- `image_path` (String(500)): 存储论文介绍图片的本地路径
- `file_path` (String(500)): 存储论文文件（PDF/Word）的本地路径

## 后端实现

### 1. 新增API端点

#### 获取论文完整详情
```
GET /api/papers/{paper_id}/detail
```
- 返回包含 `image_path` 和 `file_path` 的完整论文信息
- 与列表接口分离，避免不必要的数据传输

#### 下载论文文件
```
GET /api/papers/{paper_id}/download
```
- 根据 `file_path` 字段下载对应文件
- 支持本地文件路径
- 返回文件流，触发浏览器下载
- 自动设置正确的文件名和Content-Disposition头

### 2. 文件路径处理

后端使用 Python 的 `pathlib.Path` 处理文件路径：
- 验证文件是否存在
- 检查是否为有效文件
- 使用 FastAPI 的 `FileResponse` 返回文件

```python
from pathlib import Path
from fastapi.responses import FileResponse

file_path = Path(paper.file_path)
if not file_path.exists():
    raise HTTPException(status_code=404, detail="File not found")

return FileResponse(
    path=str(file_path),
    filename=file_path.name,
    media_type="application/octet-stream"
)
```

## 前端实现

### 1. API方法扩展

在 `front/lib/api.ts` 中添加：

```typescript
// 获取论文完整详情
getDetail: (id: string): Promise<PaperListItem> =>
  apiRequest(`/papers/${id}/detail`),

// 下载论文文件
downloadFile: async (id: string, filename?: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/papers/${id}/download`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const blob = await response.blob()
  // 触发浏览器下载
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || `paper_${id}.pdf`
  a.click()
}
```

### 2. 状态管理

添加新的状态变量：
```typescript
const [detailedPaper, setDetailedPaper] = useState<any | null>(null)
const [loadingDetail, setLoadingDetail] = useState(false)
const [downloading, setDownloading] = useState(false)
```

### 3. 按需加载详情

使用 `useEffect` 监听选中论文和标签页切换：
```typescript
useEffect(() => {
  const loadPaperDetail = async () => {
    if (selectedPaper && activeTab === "detail") {
      setLoadingDetail(true)
      const detail = await papersApi.getDetail(selectedPaper.id)
      setDetailedPaper(detail)
      setLoadingDetail(false)
    }
  }
  loadPaperDetail()
}, [selectedPaper, activeTab])
```

### 4. 图片显示组件

使用 Next.js 的 `Image` 组件：
```tsx
<Image
  src={detailedPaper.image_path}
  alt="论文介绍图"
  width={800}
  height={600}
  className="h-auto w-full object-contain"
  style={{ maxHeight: '500px' }}
  onError={(e) => {
    // 图片加载失败时的处理
    e.target.style.display = 'none'
  }}
/>
```

**特性：**
- 自动优化图片加载
- 响应式设计，自适应容器宽度
- 最大高度限制为500px，保持宽高比
- 加载失败时显示友好提示

### 5. 下载按钮

```tsx
<Button
  variant="outline"
  size="sm"
  onClick={handleDownloadFile}
  disabled={downloading}
>
  {downloading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      下载中...
    </>
  ) : (
    <>
      <FileText className="mr-2 h-4 w-4" />
      下载论文文件
    </>
  )}
</Button>
```

**特性：**
- 下载前弹出确认对话框
- 显示下载进度状态
- 禁用状态防止重复点击
- 友好的图标和文字提示

## 使用流程

### 1. 编辑论文时输入路径

在编辑对话框中：
- **封面图片 URL**: 输入本地图片路径，如 `D:/papers/images/paper_intro.png`
- **原文文件 URL**: 输入本地文件路径，如 `D:/papers/files/research.pdf`

### 2. 查看详情

1. 在论文列表中点击任意论文
2. 切换到"详情视图"标签页
3. 系统自动加载完整详情（包括图片）
4. 图片自动显示，最大高度500px
5. 显示下载按钮

### 3. 下载文件

1. 点击"下载论文文件"按钮
2. 弹出确认对话框
3. 确认后开始下载
4. 文件自动保存到用户的下载文件夹

## 性能优化

### 1. 按需加载
- 列表接口不返回 `image_path` 和 `file_path`
- 只在详情视图中调用 `/detail` 接口
- 避免加载列表时传输大量路径信息

### 2. 图片优化
- 使用 Next.js Image 组件自动优化
- 设置最大高度限制，避免超大图片
- 懒加载，只在可见时加载

### 3. 下载优化
- 使用 Blob 和 URL.createObjectURL
- 下载完成后立即释放内存
- 防止重复下载（disabled状态）

## 错误处理

### 1. 图片加载失败
- 显示"图片加载失败"提示
- 不影响其他内容显示

### 2. 文件不存在
- 后端返回404错误
- 前端显示友好错误提示

### 3. 下载失败
- 捕获异常并显示alert
- 恢复按钮可用状态

## 文件位置

### 后端
- API路由: `back/app/api/routes/papers.py`
- 数据模型: `back/app/models/tables.py`

### 前端
- API定义: `front/lib/api.ts`
- 页面组件: `front/app/(dashboard)/papers/page.tsx`

## 注意事项

1. **路径格式**: 
   - Windows: `D:/papers/file.pdf` 或 `D:\\papers\\file.pdf`
   - Linux/Mac: `/home/user/papers/file.pdf`

2. **文件权限**: 
   - 确保后端进程有读取文件的权限
   - 建议将文件存储在专门的目录中

3. **文件大小**: 
   - 大文件下载可能需要较长时间
   - 考虑添加进度条（可选）

4. **安全性**: 
   - 后端验证文件路径，防止路径遍历攻击
   - 只允许下载指定目录下的文件

## 未来改进

1. **文件上传**: 添加文件上传功能，自动保存到服务器
2. **图片预览**: 添加图片放大查看功能
3. **多文件支持**: 支持多个附件文件
4. **云存储**: 支持OSS等云存储服务
5. **进度显示**: 大文件下载时显示进度条

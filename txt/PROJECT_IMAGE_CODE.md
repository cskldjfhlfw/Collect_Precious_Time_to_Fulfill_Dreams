# 项目图片显示代码片段

## 在详情视图中添加图片显示

找到详情视图的TabsContent，在项目信息显示之前添加图片：

```tsx
<TabsContent value="detail">
  {loadingDetail ? (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  ) : selectedProject ? (
    <div className="space-y-4 rounded-lg border p-4">
      {/* 项目图片 - 添加在这里 */}
      {(detailedProject || selectedProject).image_path && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">项目图片</h4>
          <img 
            src={`/api/projects/${selectedProject.id}/image`}
            alt={(detailedProject || selectedProject).name}
            style={{
              maxWidth: '600px',
              maxHeight: '400px',
              objectFit: 'contain',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              display: 'block'
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              console.error('图片加载失败')
            }}
          />
        </div>
      )}

      {/* 原有的项目信息显示 */}
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        ...
      </div>
    </div>
  ) : (
    <div className="text-center text-muted-foreground">
      未选择项目
    </div>
  )}
</TabsContent>
```

## 需要导入的组件

确保导入了Loader2：

```tsx
import {
  // ... 其他图标
  Loader2,
} from "lucide-react"
```

## 完整的修改位置

1. 找到 `<TabsContent value="detail">` 
2. 在 `{selectedProject ? (` 后面的 `<div className="space-y-4 rounded-lg border p-4">` 内部
3. 在第一个 `<div className="flex flex-col gap-2...">` 之前
4. 插入图片显示代码

## 数据源说明

使用 `detailedProject || selectedProject` 确保：
- 优先使用详细信息（包含image_path）
- 如果详情还在加载，使用列表数据作为fallback
- 图片URL使用selectedProject.id（确保ID正确）

# 对话框优化迁移指南

## 已完成
- ✅ 论文页面 (papers)

## 待优化页面
- 专利 (patents)
- 软著 (software-copyrights)
- 项目 (projects)
- 资源 (resources)
- 比赛 (competitions)
- 会议 (conferences)
- 合作 (cooperations)

## 优化要点

### 1. 导入FormDialog组件
```tsx
import { FormDialog } from "@/components/ui/form-dialog"
```

### 2. 替换Dialog为FormDialog
**优化前：**
```tsx
<Dialog open={createOpen} onOpenChange={(open) => !saving && setCreateOpen(open)}>
  <DialogContent className="max-w-lg">
    <DialogHeader>
      <DialogTitle>新增XXX</DialogTitle>
    </DialogHeader>
    <div className="space-y-3 text-sm">
      {/* 表单字段 */}
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
      <Button onClick={handleCreate} disabled={saving}>创建</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**优化后：**
```tsx
<FormDialog
  open={createOpen}
  onOpenChange={setCreateOpen}
  title="新增XXX"
  description="填写XXX基本信息，创建新的记录"
  onSubmit={handleCreate}
  submitText="创建"
  loading={saving}
  maxWidth="2xl"
>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* 表单字段 - 使用grid布局 */}
  </div>
</FormDialog>
```

### 3. 优化表单字段布局

#### 单列字段（全宽）
```tsx
<div className="space-y-2 md:col-span-2">
  <Label htmlFor="field-id" className="text-sm font-medium">
    字段名 <span className="text-red-500">*</span>
  </Label>
  <Input
    id="field-id"
    placeholder="请输入..."
    value={form.field}
    onChange={(e) => setForm(f => ({ ...f, field: e.target.value }))}
    className="h-9"
  />
</div>
```

#### 双列字段（各占一半）
```tsx
<div className="space-y-2">
  <Label htmlFor="field-id" className="text-sm font-medium">字段名</Label>
  <Input
    id="field-id"
    placeholder="请输入..."
    value={form.field}
    onChange={(e) => setForm(f => ({ ...f, field: e.target.value }))}
    className="h-9"
  />
</div>
```

#### Textarea字段
```tsx
<div className="space-y-2 md:col-span-2">
  <Label htmlFor="field-id" className="text-sm font-medium">字段名</Label>
  <Textarea
    id="field-id"
    placeholder="请输入..."
    rows={4}
    value={form.field}
    onChange={(e) => setForm(f => ({ ...f, field: e.target.value }))}
    className="resize-none"
  />
</div>
```

#### Select字段
```tsx
<div className="space-y-2">
  <Label htmlFor="field-id" className="text-sm font-medium">字段名</Label>
  <Select
    value={form.field}
    onValueChange={(value) => setForm(f => ({ ...f, field: value }))}
  >
    <SelectTrigger id="field-id" className="h-9">
      <SelectValue placeholder="请选择..." />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="option1">选项1</SelectItem>
      <SelectItem value="option2">选项2</SelectItem>
    </SelectContent>
  </Select>
</div>
```

### 4. 错误提示优化
```tsx
<FormDialog ...>
  {formError && (
    <div className="rounded-md bg-red-50 p-3 mb-4">
      <p className="text-sm text-red-800">{formError}</p>
    </div>
  )}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* 表单字段 */}
  </div>
</FormDialog>
```

### 5. maxWidth配置建议
- 简单表单（<5个字段）：`maxWidth="lg"`
- 中等表单（5-10个字段）：`maxWidth="xl"` 或 `maxWidth="2xl"`
- 复杂表单（>10个字段）：`maxWidth="3xl"` 或 `maxWidth="4xl"`

## FormDialog组件特性

### Props
- `open`: boolean - 对话框是否打开
- `onOpenChange`: (open: boolean) => void - 状态改变回调
- `title`: string - 对话框标题
- `description?`: string - 对话框描述（可选）
- `onSubmit?`: () => void | Promise<void> - 提交回调
- `onCancel?`: () => void - 取消回调
- `submitText?`: string - 提交按钮文本（默认"确定"）
- `cancelText?`: string - 取消按钮文本（默认"取消"）
- `loading?`: boolean - 加载状态
- `maxWidth?`: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" - 最大宽度
- `maxHeight?`: string - 最大高度（默认"80vh"）

### 优势
1. ✅ 自动处理滚动溢出（使用ScrollArea）
2. ✅ 统一的样式和间距
3. ✅ 响应式布局支持
4. ✅ 加载状态自动处理
5. ✅ 优雅的动画效果
6. ✅ 防止内容超出屏幕边界

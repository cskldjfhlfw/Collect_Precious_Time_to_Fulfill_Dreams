# 文件上传问题调试指南

## 问题1：Word文件被识别为PDF

### 原因
前端文件类型检测逻辑有bug，`fileType`状态在切换论文时没有重置，导致显示的是上一个论文的文件类型。

### 修复
修改了`useEffect`依赖项，从`[detailedPaper, fileType]`改为`[detailedPaper?.file_path]`，确保每次文件路径变化时都重新检测文件类型。

```typescript
// 修复前
useEffect(() => {
  if (detailedPaper?.file_path && !fileType) {  // 只在fileType为空时检测
    // ...
  }
}, [detailedPaper, fileType]);

// 修复后
useEffect(() => {
  if (detailedPaper?.file_path) {  // 每次都检测
    // ...
  } else {
    setFileType(null);  // 清空状态
  }
}, [detailedPaper?.file_path]);  // 只依赖file_path
```

## 问题2：编辑时上传文件，数据库路径未更新

### 验证步骤

#### 1. 检查前端表单状态
编辑对话框中上传文件后：
```typescript
const result = await papersApi.uploadFile(file, 'document')
setEditForm((f) => ({ ...f, filePath: result.file_path }))
```
- ✅ `editForm.filePath` 应该更新为新的路径
- ✅ 显示"已上传：uploads/documents/xxx.docx"

#### 2. 检查保存时的payload
点击保存按钮时：
```typescript
const payload = {
  // ...
  file_path: editForm.filePath.trim() || null,
}
await papersApi.update(selectedPaper.id, payload)
```
- ✅ payload中应包含新的file_path
- ✅ 发送PUT请求到 `/api/papers/{id}`

#### 3. 检查后端更新逻辑
```python
@router.put("/{paper_id}")
async def update_paper(paper_id, paper_in: PaperUpdate):
    updated_paper = await crud_paper.update(db, db_obj=paper, obj_in=paper_in)
```
- ✅ PaperUpdate schema应包含file_path字段
- ✅ crud_paper.update应该更新所有提供的字段

### 调试方法

#### 前端调试
在浏览器控制台查看：
```javascript
// 1. 上传文件后
console.log('上传结果:', result)
console.log('表单状态:', editForm)

// 2. 保存前
console.log('保存payload:', payload)

// 3. 保存后
console.log('更新结果:', updated)
```

#### 后端调试
在`papers.py`中添加日志：
```python
@router.put("/{paper_id}")
async def update_paper(...):
    print(f"收到更新请求: {paper_in.model_dump()}")
    updated_paper = await crud_paper.update(...)
    print(f"更新后的file_path: {updated_paper.file_path}")
```

### 常见问题

#### 问题A：上传成功但表单状态未更新
**症状**：上传后没有显示"已上传：xxx"
**原因**：上传API返回的字段名不匹配
**解决**：检查API返回的是`file_path`还是`filePath`

#### 问题B：保存时路径为空
**症状**：保存后数据库中file_path为null
**原因**：payload中file_path被trim()后变成空字符串，然后被设为null
**解决**：确保editForm.filePath有值

#### 问题C：路径格式错误
**症状**：保存成功但下载时找不到文件
**原因**：路径使用了反斜杠`\`而不是正斜杠`/`
**解决**：后端上传API应该返回正斜杠格式的路径

## 完整测试流程

### 测试1：新增论文并上传文件
1. 点击"新增论文"
2. 填写标题等基本信息
3. 点击"原文文件"选择器
4. 选择一个Word文件（如test.docx）
5. 等待上传成功提示
6. 检查是否显示"已上传：uploads/documents/test_20251127_xxx.docx"
7. 点击"创建"
8. 切换到详情视图
9. 检查下载按钮是否显示"下载Word文件"
10. 点击下载，验证下载的是Word文件

### 测试2：编辑论文并更换文件
1. 选择一个已有论文
2. 点击"编辑"
3. 点击"原文文件"选择器
4. 选择一个新的Word文件
5. 等待上传成功提示
6. 点击"保存"
7. 刷新页面或重新加载详情
8. 检查下载按钮是否显示"下载Word文件"
9. 点击下载，验证下载的是新上传的Word文件

### 测试3：混合文件类型
1. 创建论文A，上传PDF文件
2. 创建论文B，上传Word文件
3. 查看论文A详情，检查显示"下载PDF文件"
4. 查看论文B详情，检查显示"下载Word文件"
5. 来回切换A和B，确认文件类型显示正确

## 数据库验证

### 查询论文的文件路径
```sql
SELECT id, title, file_path FROM papers WHERE id = 'xxx';
```

### 检查路径格式
正确格式：`uploads/documents/filename_20251127_161430_123.docx`
错误格式：
- `uploads\documents\filename.docx` (反斜杠)
- `D:/uploads/documents/filename.docx` (绝对路径)
- 空字符串或NULL

### 检查文件是否存在
```bash
# Windows
dir back\uploads\documents\

# 检查特定文件
Test-Path "back\uploads\documents\filename_20251127_161430_123.docx"
```

## 解决方案总结

### 已修复
1. ✅ 文件类型检测逻辑 - 每次切换论文时重新检测
2. ✅ 文件名编码问题 - 使用RFC 5987标准编码中文文件名

### 需要验证
1. ⏳ 编辑时上传文件后数据库是否正确更新
2. ⏳ 文件路径格式是否正确（正斜杠）
3. ⏳ 文件是否真的保存到uploads文件夹

### 如果问题仍然存在

#### 检查Schema定义
```python
# back/app/schemas/papers.py
class PaperUpdate(BaseSchema):
    # 确保包含这些字段
    image_path: Optional[str] = None
    file_path: Optional[str] = None
```

#### 检查CRUD更新方法
```python
# back/app/crud/crud_paper.py
async def update(self, db: AsyncSession, *, db_obj, obj_in):
    # 确保更新所有字段
    update_data = obj_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj
```

## 联系支持
如果按照以上步骤仍无法解决问题，请提供：
1. 浏览器控制台的完整日志
2. 后端服务器的日志输出
3. 数据库中该论文的完整记录
4. 上传的文件名和类型

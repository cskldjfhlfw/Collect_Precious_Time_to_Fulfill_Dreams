# 文件上传功能测试步骤

## 测试前准备

1. 启动后端服务器
2. 启动前端服务器
3. 打开浏览器开发者工具（F12）
4. 切换到Console标签页

## 测试场景1：编辑论文并上传Word文件

### 步骤
1. 登录系统
2. 进入论文管理页面
3. 选择一个论文
4. 点击"编辑"按钮
5. 点击"原文文件"文件选择器
6. 选择一个Word文件（.docx）
7. **观察控制台输出**

### 预期控制台输出
```
开始上传文件: test.docx 类型: application/vnd.openxmlformats-officedocument.wordprocessingml.document
文件上传成功: {
  success: true,
  file_path: "uploads/documents/test_20251127_162345_123.docx",
  original_filename: "test.docx",
  new_filename: "test_20251127_162345_123.docx",
  file_type: "document",
  message: "文件上传成功"
}
```

### 预期弹窗
```
文件上传成功：test_20251127_162345_123.docx
路径：uploads/documents/test_20251127_162345_123.docx
```

### 预期界面显示
在文件选择器下方应该显示：
```
已上传：uploads/documents/test_20251127_162345_123.docx
```

## 测试场景2：保存编辑

### 步骤
1. 继续上面的操作
2. 点击"保存"按钮
3. **观察控制台输出**

### 预期控制台输出
```
保存论文 - editForm: {
  title: "测试论文",
  authors: "张三",
  journal: "测试期刊",
  status: "draft",
  doi: "",
  url: "",
  abstract: "",
  keywords: "",
  imagePath: "",
  filePath: "uploads/documents/test_20251127_162345_123.docx",  // ← 重点检查
  relatedProjects: ""
}

保存论文 - payload: {
  title: "测试论文",
  journal: "测试期刊",
  status: "draft",
  doi: null,
  abstract: null,
  url: null,
  image_path: null,
  file_path: "uploads/documents/test_20251127_162345_123.docx",  // ← 重点检查
  authors: "张三"
}
```

### 预期后端日志
在后端控制台应该看到：
```
=== 更新论文 5e4137a1-7554-4b1e-942f-c9f7bd320c94 ===
更新前 file_path: uploads/documents/old_file.pdf
请求数据: {'title': '测试论文', 'file_path': 'uploads/documents/test_20251127_162345_123.docx', ...}
更新后 file_path: uploads/documents/test_20251127_162345_123.docx
=== 更新完成 ===
```

## 测试场景3：验证文件类型识别

### 步骤
1. 保存后关闭编辑对话框
2. 在详情视图中查看论文
3. **观察下载按钮文本**

### 预期结果
- 下载按钮应显示：**"下载Word文件"**（不是"下载PDF文件"）
- 按钮图标应该是蓝色的文本图标
- 提示文本应显示："点击下载论文的Word文件"

### 预期控制台输出
```
// 当切换到详情视图时，应该看到文件类型检测日志
// （如果添加了console.log的话）
```

## 测试场景4：下载文件

### 步骤
1. 点击"下载Word文件"按钮
2. 确认下载
3. 检查下载的文件

### 预期结果
- 文件应该成功下载
- 文件名应该是：`test_20251127_162345_123.docx`
- 文件应该可以用Word打开
- 文件内容应该是你上传的内容

## 测试场景5：切换论文验证文件类型

### 步骤
1. 创建或选择另一个论文，上传PDF文件
2. 查看该论文详情，确认显示"下载PDF文件"
3. 切换回之前的Word论文
4. **观察文件类型是否正确切换**

### 预期结果
- 切换到Word论文时，应显示"下载Word文件"
- 切换到PDF论文时，应显示"下载PDF文件"
- 不应该出现类型混淆

## 问题排查清单

### 如果上传后"已上传"不显示
- [ ] 检查控制台是否有"文件上传成功"日志
- [ ] 检查返回的`result.file_path`是否有值
- [ ] 检查`setEditForm`是否被正确调用

### 如果保存后数据库未更新
- [ ] 检查控制台的payload中`file_path`是否有值
- [ ] 检查后端日志中"请求数据"是否包含file_path
- [ ] 检查后端日志中"更新后 file_path"是否正确
- [ ] 检查数据库：`SELECT file_path FROM papers WHERE id = 'xxx'`

### 如果文件类型显示错误
- [ ] 检查`detailedPaper.file_path`的扩展名
- [ ] 检查控制台是否有文件类型检测相关的日志
- [ ] 尝试刷新页面重新加载

### 如果下载时报错
- [ ] 检查后端日志中的错误信息
- [ ] 检查文件是否真的存在于`back/uploads/documents/`
- [ ] 检查文件路径格式（应该是正斜杠`/`）
- [ ] 检查文件名是否包含特殊字符

## 数据库验证SQL

```sql
-- 查看论文的文件路径
SELECT id, title, file_path, image_path 
FROM papers 
WHERE id = '你的论文ID';

-- 查看最近更新的论文
SELECT id, title, file_path, updated_at 
FROM papers 
ORDER BY updated_at DESC 
LIMIT 5;

-- 查找所有Word文件
SELECT id, title, file_path 
FROM papers 
WHERE file_path LIKE '%.docx' OR file_path LIKE '%.doc';

-- 查找所有PDF文件
SELECT id, title, file_path 
FROM papers 
WHERE file_path LIKE '%.pdf';
```

## 文件系统验证

### Windows PowerShell
```powershell
# 查看uploads文件夹结构
Get-ChildItem -Recurse back\uploads\

# 查看documents文件夹内容
Get-ChildItem back\uploads\documents\

# 检查特定文件是否存在
Test-Path "back\uploads\documents\test_20251127_162345_123.docx"

# 查看文件详细信息
Get-Item "back\uploads\documents\test_20251127_162345_123.docx" | Format-List
```

## 成功标准

所有以下条件都满足才算测试通过：

- [x] 上传Word文件成功，显示"已上传"
- [x] 保存后控制台显示正确的payload
- [x] 后端日志显示file_path被正确更新
- [x] 数据库中file_path字段正确更新
- [x] 详情视图显示"下载Word文件"
- [x] 点击下载能成功下载Word文件
- [x] 切换论文时文件类型正确识别
- [x] 文件存在于`back/uploads/documents/`目录

## 常见错误及解决方案

### 错误1：UnicodeEncodeError
**症状**：下载时后端报错 `'latin-1' codec can't encode characters`
**原因**：文件名包含中文字符
**解决**：已修复，使用RFC 5987编码

### 错误2：文件类型始终显示PDF
**症状**：上传Word后仍显示"下载PDF文件"
**原因**：文件类型检测逻辑bug
**解决**：已修复，修改useEffect依赖项

### 错误3：文件上传成功但数据库未更新
**症状**：上传成功，但刷新后文件路径消失
**原因**：保存时payload未包含file_path
**检查**：查看控制台payload日志

### 错误4：文件不存在
**症状**：下载时报404错误
**原因**：文件路径格式错误或文件未真正上传
**检查**：
1. 检查uploads文件夹是否存在文件
2. 检查数据库中的路径格式
3. 检查路径是否使用正斜杠

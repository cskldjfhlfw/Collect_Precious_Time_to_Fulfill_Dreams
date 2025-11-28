# 项目图片显示功能测试指南

## ✅ 已完成的工作

1. ✅ 数据库迁移（添加startup_script_path和startup_command字段）
2. ✅ 更新Projects Schema
3. ✅ 创建项目详情API（`GET /api/projects/{id}/detail`）
4. ✅ 创建项目图片API（`GET /api/projects/{id}/image`）
5. ✅ 更新前端API调用
6. ✅ 修改项目页面显示图片

## 测试步骤

### 步骤1：准备测试数据

#### 方法A：通过数据库直接设置
```sql
-- 为某个项目设置图片路径
UPDATE projects 
SET image_path = 'uploads/images/project_demo.png'
WHERE id = '你的项目ID';

-- 查看设置结果
SELECT id, name, image_path FROM projects WHERE image_path IS NOT NULL;
```

#### 方法B：准备图片文件
1. 在`back/uploads/images/`目录下放置测试图片
2. 图片命名示例：`project_demo.png`
3. 确保图片格式为：jpg, jpeg, png, gif, bmp, webp, svg

### 步骤2：启动服务

```bash
# 启动后端（在back目录）
cd back
python -m uvicorn app.main:app --reload

# 启动前端（在front目录）
cd front
npm run dev
```

### 步骤3：测试图片显示

1. **登录系统**
2. **进入项目管理页面**
3. **选择一个有图片的项目**
4. **切换到"详情"标签页**
5. **观察图片是否正确显示**

### 预期结果

#### 成功标准
- ✅ 切换到详情视图时显示加载动画
- ✅ 加载完成后显示项目图片
- ✅ 图片尺寸被限制在600px宽x400px高
- ✅ 图片保持原始宽高比（objectFit: contain）
- ✅ 图片有边框和圆角
- ✅ 如果项目没有图片，不显示图片区域

#### 如果图片不显示
1. 打开浏览器开发者工具（F12）
2. 查看Console是否有错误
3. 查看Network标签，检查图片请求
4. 确认图片URL：`/api/projects/{project_id}/image`

### 步骤4：测试不同场景

#### 场景1：项目有图片
- 选择有image_path的项目
- 确认图片正确显示

#### 场景2：项目无图片
- 选择没有image_path的项目
- 确认不显示图片区域
- 确认不影响其他信息显示

#### 场景3：切换项目
- 从有图片的项目切换到无图片的项目
- 确认图片区域正确隐藏/显示

#### 场景4：图片加载失败
- 设置一个不存在的图片路径
- 确认图片不显示，不影响页面布局
- 控制台应显示"图片加载失败"

## 调试技巧

### 检查后端API

#### 测试详情API
```bash
curl http://localhost:8000/api/projects/{project_id}/detail
```
应返回包含image_path的JSON

#### 测试图片API
```bash
curl http://localhost:8000/api/projects/{project_id}/image --output test.png
```
应下载图片文件

### 检查前端

#### 浏览器控制台
```javascript
// 检查详情数据
console.log(detailedProject)

// 检查图片路径
console.log(detailedProject?.image_path)
```

#### Network标签
1. 切换到详情视图
2. 查看Network标签
3. 应该看到两个请求：
   - `GET /api/projects/{id}/detail` - 获取详情
   - `GET /api/projects/{id}/image` - 获取图片

## 常见问题

### 问题1：图片不显示
**可能原因**：
- 图片路径不正确
- 图片文件不存在
- 文件权限问题

**解决方法**：
```bash
# 检查文件是否存在
ls -la back/uploads/images/

# 检查文件权限
chmod 644 back/uploads/images/*.png
```

### 问题2：404错误
**可能原因**：
- 项目没有image_path
- 图片文件路径错误

**解决方法**：
```sql
-- 检查数据库
SELECT id, name, image_path FROM projects WHERE id = 'xxx';
```

### 问题3：图片太大或太小
**说明**：
- 图片会自动缩放到最大600x400px
- 保持原始宽高比
- 这是正常行为

### 问题4：CORS错误
**可能原因**：
- 前后端端口不匹配
- CORS配置问题

**解决方法**：
检查`back/app/main.py`中的CORS配置

## 性能验证

### 按需加载验证
1. 打开Network标签
2. 在列表视图中浏览项目
3. **不应该**看到图片请求
4. 切换到详情视图
5. **应该**看到详情和图片请求

这证明图片是按需加载的，不会在列表视图浪费流量。

## 下一步：添加启动功能

如果图片显示功能测试通过，可以继续实现启动功能：

### 方案B：简单启动（无审批）
1. 添加启动按钮
2. 管理员直接启动项目
3. 显示运行状态

### 方案C：完整功能
1. 启动请求和审批流程
2. 自动关闭机制（1小时）
3. 授权管理页面

请告诉我你想继续实现哪个方案！

## 测试数据示例

```sql
-- 创建测试项目
INSERT INTO projects (
  id, name, project_number, project_type, status, 
  image_path, startup_command, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  '测试项目',
  'TEST001',
  '研发',
  'active',
  'uploads/images/test_project.png',
  'bash start.sh',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
```

## 成功标志

当你看到以下情况时，说明功能实现成功：

- [x] 数据库迁移成功执行
- [x] 后端API正常响应
- [x] 前端页面无报错
- [x] 图片正确显示
- [x] 图片尺寸合适
- [x] 按需加载工作正常
- [ ] 所有测试场景通过

祝测试顺利！🎉

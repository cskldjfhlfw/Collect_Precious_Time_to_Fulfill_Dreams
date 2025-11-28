# 🔒 快速应用权限控制指南

## ✅ 已完成示例
- ✅ `papers/page.tsx` - 论文页面（已添加权限控制）

## 📝 需要修改的页面列表

以下页面需要添加相同的权限控制：

1. ✅ `papers/page.tsx` - 论文
2. ⏳ `patents/page.tsx` - 专利
3. ⏳ `projects/page.tsx` - 项目
4. ⏳ `resources/page.tsx` - 资源
5. ⏳ `competitions/page.tsx` - 竞赛
6. ⏳ `software-copyrights/page.tsx` - 软著
7. ⏳ `conferences/page.tsx` - 会议
8. ⏳ `cooperations/page.tsx` - 合作

---

## 🚀 快速修改步骤（3步）

对每个页面执行以下操作：

### 步骤1: 添加导入
```typescript
// 在文件顶部imports部分添加
import { usePermissions } from "@/hooks/usePermissions"
```

### 步骤2: 使用Hook
```typescript
// 在组件函数开头添加
export default function XxxPage() {
  const { canCreate, canEdit, canDelete } = usePermissions()
  // ... 其他代码
}
```

### 步骤3: 包裹按钮

#### 新建按钮
```typescript
// 修改前
<Button onClick={() => setCreateOpen(true)}>
  <Plus /> 新建XXX
</Button>

// 修改后
{canCreate && (
  <Button onClick={() => setCreateOpen(true)}>
    <Plus /> 新建XXX
  </Button>
)}
```

#### 编辑按钮
```typescript
// 修改前
<Button onClick={openEditDialog}>
  <Pencil /> 编辑
</Button>

// 修改后
{canEdit && (
  <Button onClick={openEditDialog}>
    <Pencil /> 编辑
  </Button>
)}
```

#### 删除按钮
```typescript
// 修改前
<Button onClick={handleDelete}>
  <Trash2 /> 删除
</Button>

// 修改后
{canDelete && (
  <Button onClick={handleDelete}>
    <Trash2 /> 删除
  </Button>
)}
```

---

## 🎯 权限效果

### 超级管理员 (superadmin)
- ✅ 看到所有按钮（新建、编辑、删除、批量导入）
- ✅ 可以执行所有操作

### 管理员 (admin)  
- ✅ 看到新建、编辑、删除按钮
- ❌ 看不到批量导入按钮
- ✅ 可以管理数据

### 普通用户 (user)
- ❌ 看不到任何操作按钮
- ✅ 只能查看数据
- ❌ 不能创建/编辑/删除

---

## 📋 完整修改示例（论文页面）

```typescript
"use client"

// 1. 添加导入
import { usePermissions } from "@/hooks/usePermissions"

export default function PapersPage() {
  // 2. 使用权限Hook
  const { canCreate, canEdit, canDelete } = usePermissions()
  
  // ... 其他代码
  
  return (
    <div>
      {/* 3. 包裹新建按钮 */}
      {canCreate && (
        <Button onClick={() => setCreateOpen(true)}>
          <Plus /> 新增论文
        </Button>
      )}
      
      {/* 4. 包裹编辑按钮 */}
      {canEdit && (
        <Button onClick={openEditDialog}>
          <Pencil /> 编辑
        </Button>
      )}
      
      {/* 5. 包裹删除按钮 */}
      {canDelete && (
        <Button onClick={handleDelete}>
          <Trash2 /> 删除
        </Button>
      )}
    </div>
  )
}
```

---

## ⚡ 批量修改技巧

### 使用查找替换（推荐）

1. **新建按钮**
   - 查找: `<Button(.*)onClick={() => setCreateOpen\(true\)}`
   - 替换: `{canCreate && (\n  <Button$1onClick={() => setCreateOpen(true)}`
   - 在结尾添加: `\n)}`

2. **编辑按钮**
   - 查找包含`openEditDialog`的Button
   - 用`{canEdit && ( ... )}`包裹

3. **删除按钮**
   - 查找包含`handleDelete`的Button
   - 用`{canDelete && ( ... )}`包裹

---

## ✅ 验证清单

修改完每个页面后，检查：

- [ ] 导入了`usePermissions`
- [ ] 在组件中使用了`const { canCreate, canEdit, canDelete } = usePermissions()`
- [ ] 新建按钮被`{canCreate && ( ... )}`包裹
- [ ] 编辑按钮被`{canEdit && ( ... )}`包裹
- [ ] 删除按钮被`{canDelete && ( ... )}`包裹
- [ ] 批量导入按钮已经自动隐藏（ImportDialog组件已处理）

---

## 🧪 测试

### 1. 测试普通用户
```bash
# 使用普通用户登录
- 应该看不到任何新建/编辑/删除按钮
- 只能查看数据列表和详情
```

### 2. 测试管理员
```bash
# 使用管理员登录
- 应该看到新建/编辑/删除按钮
- 看不到批量导入按钮
- 可以正常操作数据
```

### 3. 测试超级管理员
```bash
# 使用超级管理员登录
- 应该看到所有按钮（包括批量导入）
- 可以执行所有操作
```

---

## 🎉 完成！

按照这个指南修改所有页面后，权限系统将完全生效：
- 普通用户只能查看
- 管理员可以管理数据
- 超级管理员拥有所有权限

记得测试每个角色的权限是否正确！

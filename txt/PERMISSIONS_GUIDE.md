# 🔐 权限管理系统使用指南

## 📋 权限说明

### 角色权限对比

| 功能 | 超级管理员 | 管理员 | 普通用户 |
|------|-----------|--------|---------|
| **查看数据** | ✅ | ✅ | ✅ |
| **创建数据** | ✅ | ✅ | ❌ |
| **编辑数据** | ✅ | ✅ | ❌ |
| **删除数据** | ✅ | ✅ | ❌ |
| **批量导入** | ✅ | ❌ | ❌ |
| **导出数据** | ✅ | ✅ | ❌ |
| **用户管理** | ✅ | ❌ | ❌ |

---

## 🛠️ 已完成的修改

### 1. 创建权限Hook
**文件**: `front/hooks/usePermissions.ts`

```typescript
import { usePermissions } from '@/hooks/usePermissions'

function MyComponent() {
  const { canCreate, canEdit, canDelete, canImport, role } = usePermissions()
  
  return (
    <>
      {canCreate && <Button>创建</Button>}
      {canImport && <ImportDialog />}
    </>
  )
}
```

### 2. 修改批量导入组件
**文件**: `front/components/import-dialog.tsx`

- ✅ 添加权限检查
- ✅ 只有超级管理员可以看到"批量导入"按钮
- ✅ 其他角色完全不显示该按钮

---

## 📝 如何在页面中使用权限控制

### 示例1: 论文页面按钮控制

```typescript
// front/app/(dashboard)/papers/page.tsx
import { usePermissions } from '@/hooks/usePermissions'

export default function PapersPage() {
  const { canCreate, canEdit, canDelete, canImport } = usePermissions()
  
  return (
    <div>
      {/* 创建按钮 - 管理员和超级管理员可见 */}
      {canCreate && (
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          新建论文
        </Button>
      )}
      
      {/* 批量导入 - 只有超级管理员可见 */}
      {canImport && (
        <ImportDialog
          entityType="papers"
          entityName="论文"
          apiEndpoint="/api/papers"
        />
      )}
      
      {/* 编辑按钮 - 管理员和超级管理员可见 */}
      {canEdit && (
        <Button onClick={() => handleEdit(paper.id)}>
          编辑
        </Button>
      )}
      
      {/* 删除按钮 - 管理员和超级管理员可见 */}
      {canDelete && (
        <Button variant="destructive" onClick={() => handleDelete(paper.id)}>
          删除
        </Button>
      )}
    </div>
  )
}
```

### 示例2: 检查单个权限

```typescript
import { useHasPermission } from '@/hooks/usePermissions'

function ExportButton() {
  const canExport = useHasPermission('canExport')
  
  if (!canExport) return null
  
  return <Button>导出数据</Button>
}
```

### 示例3: 根据角色显示不同内容

```typescript
import { usePermissions } from '@/hooks/usePermissions'

function Dashboard() {
  const { role } = usePermissions()
  
  return (
    <div>
      {role === 'superadmin' && <AdminPanel />}
      {role === 'admin' && <ManagerPanel />}
      {role === 'user' && <ViewOnlyPanel />}
    </div>
  )
}
```

---

## 🎯 需要修改的页面

### 已修改 ✅
- ✅ `components/import-dialog.tsx` - 批量导入权限控制

### 待修改 📝

以下页面需要添加权限控制：

#### 1. 论文页面 (`papers/page.tsx`)
```typescript
import { usePermissions } from '@/hooks/usePermissions'

export default function PapersPage() {
  const { canCreate, canEdit, canDelete } = usePermissions()
  
  // 隐藏创建/编辑/删除按钮
}
```

#### 2. 项目页面 (`projects/page.tsx`)
```typescript
const { canCreate, canEdit, canDelete } = usePermissions()
```

#### 3. 专利页面 (`patents/page.tsx`)
#### 4. 资源页面 (`resources/page.tsx`)
#### 5. 竞赛页面 (`competitions/page.tsx`)
#### 6. 软著页面 (`software-copyrights/page.tsx`)
#### 7. 会议页面 (`conferences/page.tsx`)
#### 8. 合作页面 (`cooperations/page.tsx`)

---

## 🔧 快速修改模板

### 在任何列表页面中添加权限控制：

```typescript
"use client"

import { usePermissions } from '@/hooks/usePermissions'

export default function ListPage() {
  const { canCreate, canEdit, canDelete, canImport } = usePermissions()
  
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1>标题</h1>
        
        <div className="flex gap-2">
          {/* 批量导入 - 只有superadmin */}
          {canImport && <ImportDialog />}
          
          {/* 创建按钮 - admin和superadmin */}
          {canCreate && (
            <Button onClick={handleCreate}>
              新建
            </Button>
          )}
        </div>
      </div>
      
      {/* 列表中的操作按钮 */}
      <div className="flex gap-2">
        {canEdit && <Button onClick={handleEdit}>编辑</Button>}
        {canDelete && <Button onClick={handleDelete}>删除</Button>}
      </div>
    </div>
  )
}
```

---

## 🎨 UI效果

### 超级管理员视图
```
[新建] [批量导入] [导出]
┌──────────────────────────┐
│ 论文列表                  │
│ [编辑] [删除] [查看]      │
└──────────────────────────┘
```

### 管理员视图
```
[新建] [导出]
┌──────────────────────────┐
│ 论文列表                  │
│ [编辑] [删除] [查看]      │
└──────────────────────────┘
```

### 普通用户视图
```
（无操作按钮）
┌──────────────────────────┐
│ 论文列表                  │
│ [查看]                    │
└──────────────────────────┘
```

---

## 🧪 测试步骤

### 1. 测试超级管理员权限
```bash
# 使用第一个注册的用户登录（自动为superadmin）
- 应该看到所有按钮（包括"批量导入"）
```

### 2. 测试管理员权限
```bash
# 创建第二个用户并设置为admin
- 应该看到创建/编辑/删除按钮
- 不应该看到"批量导入"按钮
```

### 3. 测试普通用户权限
```bash
# 创建第三个用户（默认为user）
- 只能查看数据
- 不应该看到任何操作按钮
```

---

## 🔒 后端权限控制（建议）

前端权限控制只是UI层面的，还需要在后端API添加权限验证：

```python
# back/app/api/deps.py
from app.api.deps import get_current_admin_user, get_current_superadmin_user

# 需要管理员权限
@router.post("/papers")
async def create_paper(
    current_user: Annotated[User, Depends(get_current_admin_user)]
):
    # 只有admin和superadmin可以创建
    pass

# 需要超级管理员权限
@router.post("/users")
async def create_user(
    current_user: Annotated[User, Depends(get_current_superadmin_user)]
):
    # 只有superadmin可以创建用户
    pass
```

---

## ✅ 完成清单

前端权限控制：
- [x] 创建权限Hook
- [x] 修改ImportDialog组件
- [ ] 修改所有列表页面
- [ ] 添加编辑/删除按钮的权限控制
- [ ] 测试三种角色的权限

后端权限控制：
- [x] 已有基础权限检查（get_current_admin_user等）
- [ ] 为所有创建/编辑/删除API添加权限检查
- [ ] 为批量导入API添加superadmin权限检查

---

## 🎉 使用权限系统

现在你可以在任何组件中使用：

```typescript
import { usePermissions } from '@/hooks/usePermissions'

const { canCreate, canEdit, canDelete, canImport, role } = usePermissions()
```

简单、清晰、类型安全！

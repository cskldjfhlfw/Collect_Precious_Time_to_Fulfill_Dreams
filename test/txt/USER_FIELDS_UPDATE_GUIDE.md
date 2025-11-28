# 📱 用户手机号和地区字段添加完成

## ✅ 已完成的修改

### 1. 后端数据库模型 ✅

**文件**: `back/app/models/tables.py`

```python
class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "users"
    
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="user", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # ← 新增
    region: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # ← 新增
```

---

### 2. 后端Schema定义 ✅

**文件**: `back/app/schemas/auth.py`

```python
class UserInfo(BaseModel):
    """用户信息"""
    id: str
    username: str
    email: str
    role: str
    name: Optional[str] = None
    is_active: bool = True
    phone: Optional[str] = None  # ← 新增
    region: Optional[str] = None  # ← 新增

class UserUpdate(BaseModel):
    """更新用户信息"""
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    role: Optional[str] = None
    phone: Optional[str] = None  # ← 新增
    region: Optional[str] = None  # ← 新增
```

---

### 3. 后端API接口 ✅

#### 获取当前用户信息
**接口**: `GET /api/auth/me`

返回数据包含phone和region字段。

#### 更新当前用户信息
**接口**: `PATCH /api/auth/me`

```json
{
  "phone": "+86 138-0000-0000",
  "region": "北京市"
}
```

**文件**: `back/app/api/routes/auth.py`
- ✅ 已添加 `PATCH /api/auth/me` 接口
- ✅ 支持更新phone和region字段
- ✅ 包含重复检查和验证

#### 超级管理员用户管理
**文件**: `back/app/api/routes/users.py`
- ✅ 已更新用户列表和详情接口
- ✅ 已更新用户信息修改接口

---

### 4. 前端类型定义 ✅

**文件**: `front/contexts/settings-context.tsx`

```typescript
export interface UserSettings {
  avatar: string
  fullName: string
  email: string
  phone: string
  region?: string  // ← 新增
  timezone: string
  // ...其他字段
}
```

---

### 5. 前端设置页面 ✅

**文件**: `front/app/(dashboard)/settings/page.tsx`

添加了：
1. ✅ 地区输入框
2. ✅ API调用逻辑
3. ✅ 保存功能

```tsx
<div className="space-y-2">
  <Label htmlFor="phone">手机号码</Label>
  <Input 
    id="phone" 
    type="tel" 
    value={settings.phone} 
    onChange={(e) => updateSettings({ phone: e.target.value })} 
  />
</div>

<div className="space-y-2">
  <Label htmlFor="region">地区</Label>
  <Input 
    id="region" 
    type="text" 
    value={settings.region || ''} 
    onChange={(e) => updateSettings({ region: e.target.value })} 
    placeholder="例如：北京市、上海市" 
  />
</div>
```

---

## 🗄️ 数据库迁移

### 需要执行的SQL脚本

**文件**: `ADD_USER_FIELDS_MIGRATION.sql`

```sql
-- 添加phone字段（可空，最大20个字符）
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20) NULL;

-- 添加region字段（可空，最大100个字符）
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS region VARCHAR(100) NULL;
```

### 执行步骤

1. **连接到PostgreSQL数据库**
   ```bash
   psql -U postgres -d your_database_name
   ```

2. **执行迁移脚本**
   ```bash
   \i ADD_USER_FIELDS_MIGRATION.sql
   ```

   或者直接执行SQL：
   ```sql
   ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20) NULL;
   ALTER TABLE users ADD COLUMN IF NOT EXISTS region VARCHAR(100) NULL;
   ```

3. **验证字段已添加**
   ```sql
   \d users
   ```

---

## 🔄 API使用示例

### 获取当前用户信息

```bash
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**响应**:
```json
{
  "id": "user-id",
  "username": "testuser",
  "email": "test@example.com",
  "role": "user",
  "phone": "+86 138-0000-0000",
  "region": "北京市",
  "is_active": true
}
```

### 更新当前用户信息

```bash
curl -X PATCH http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+86 138-0000-0000",
    "region": "上海市"
  }'
```

---

## 📝 使用说明

### 前端使用

1. **在设置页面修改**
   - 访问 `/settings` 页面
   - 在"账户"标签页中填写手机号和地区
   - 点击"保存账户设置"按钮

2. **字段验证**
   - 手机号：可选，最大20个字符
   - 地区：可选，最大100个字符
   - 两个字段都可以为空

### 后端开发

更新用户信息时，phone和region会自动保存：

```python
@router.patch("/me", response_model=UserInfo)
async def update_current_user(
    user_data: UserUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_session)]
):
    # 更新手机号
    if user_data.phone is not None:
        current_user.phone = user_data.phone
    
    # 更新地区
    if user_data.region is not None:
        current_user.region = user_data.region
    
    await db.commit()
    return UserInfo(...)
```

---

## ✅ 完成清单

- [x] 数据库模型添加字段
- [x] Schema定义更新
- [x] API接口实现
- [x] 前端类型定义
- [x] 前端UI添加输入框
- [x] 前端保存逻辑
- [ ] **数据库迁移执行**（需要手动执行SQL）

---

## 🧪 测试建议

1. **执行数据库迁移**
   ```sql
   ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20) NULL;
   ALTER TABLE users ADD COLUMN IF NOT EXISTS region VARCHAR(100) NULL;
   ```

2. **重启后端服务**
   ```bash
   cd back
   uvicorn app.main:app --reload
   ```

3. **测试前端**
   - 登录系统
   - 访问设置页面
   - 填写手机号和地区
   - 保存并刷新页面验证

4. **API测试**
   - 调用 `GET /api/auth/me` 查看字段
   - 调用 `PATCH /api/auth/me` 更新字段

---

## 📊 数据结构

| 字段 | 类型 | 长度 | 可空 | 说明 |
|------|------|------|------|------|
| phone | VARCHAR | 20 | ✅ | 用户手机号码 |
| region | VARCHAR | 100 | ✅ | 用户所在地区 |

---

## 🎉 总结

所有代码修改已完成！

**下一步**：执行数据库迁移SQL脚本即可使用新功能。

```sql
-- 复制并执行以下SQL
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS region VARCHAR(100) NULL;
```

完成后重启后端服务，即可在设置页面中修改手机号和地区信息！

# 📧 验证码注册功能实现指南

## ✅ 已完成的后端实现

### 1. 新增API端点

#### POST `/api/auth/send-code?for_register=true`
发送注册验证码

**请求**：
```json
{
  "email": "user@example.com"
}
```

**响应**：
```json
{
  "message": "验证码已发送到您的邮箱",
  "expires_in": 300
}
```

#### POST `/api/auth/register-with-code`
使用验证码注册

**请求**：
```json
{
  "username": "testuser",
  "email": "user@example.com",
  "code": "123456",
  "name": "测试用户"
}
```

**响应**：
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "username": "testuser",
    "email": "user@example.com",
    "role": "user"
  }
}
```

### 2. 前端API已封装

**文件**: `front/lib/api/auth.ts`

```typescript
// 发送注册验证码（注意参数）
await authApi.sendCode({ email: "user@example.com" })

// 验证码注册
await authApi.registerWithCode({
  username: "testuser",
  email: "user@example.com",
  code: "123456",
  name: "测试用户"
})
```

---

## 📝 前端注册界面修改指南

### 文件：`front/app/(auth)/_components/auth-page.tsx`

### 步骤1: 添加状态管理

在组件开头添加以下状态：

```tsx
export default function AuthOverlay({ initialMode }: AuthPageProps) {
  // ... 现有状态
  
  // 新增：验证码相关状态
  const [useCodeRegister, setUseCodeRegister] = useState(false) // 是否使用验证码注册
  const [codeSent, setCodeSent] = useState(false) // 验证码是否已发送
  const [countdown, setCountdown] = useState(0) // 倒计时
  
  // ... 其他代码
}
```

### 步骤2: 添加发送验证码函数

```tsx
const handleSendRegisterCode = async (email: string) => {
  try {
    setLoading(true)
    setError('')
    
    // 发送注册验证码（注意：需要在URL添加for_register参数）
    const response = await fetch('http://localhost:8000/api/auth/send-code?for_register=true', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || '发送验证码失败')
    }
    
    setCodeSent(true)
    setCountdown(60)
    
    // 启动倒计时
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    alert('验证码已发送到您的邮箱')
  } catch (err) {
    setError(err instanceof Error ? err.message : '发送验证码失败')
  } finally {
    setLoading(false)
  }
}
```

### 步骤3: 修改注册提交逻辑

找到 `handleSubmit` 函数中的注册部分，修改为：

```tsx
const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault()
  setError('')
  setLoading(true)

  try {
    const formData = new FormData(event.currentTarget)
    const password = formData.get('password') as string

    if (isLogin) {
      // 登录逻辑保持不变
      const username_or_email = formData.get('username_or_email') as string
      await login({ username_or_email, password })
    } else {
      // 注册逻辑
      const username = formData.get('username') as string
      const name = formData.get('name') as string
      const email = formData.get('email') as string
      
      if (useCodeRegister) {
        // 验证码注册
        const code = formData.get('code') as string
        
        if (!code || code.length !== 6) {
          setError('请输入6位验证码')
          return
        }
        
        const response = await authApi.registerWithCode({
          username,
          email,
          code,
          name
        })
        
        // 保存token和用户信息
        setToken(response.access_token)
        setUser(response.user)
        localStorage.setItem('auth_token', response.access_token)
        localStorage.setItem('auth_user', JSON.stringify(response.user))
        router.push('/papers')
      } else {
        // 密码注册（原有逻辑）
        const confirm = formData.get('confirm') as string

        if (password !== confirm) {
          setError('两次输入的密码不一致')
          return
        }

        await register({ username, email, password, name })
      }
    }
  } catch (error) {
    setError(error instanceof Error ? error.message : '操作失败')
  } finally {
    setLoading(false)
  }
}
```

### 步骤4: 修改注册表单UI

找到注册表单部分（`{!isLogin && ...}`），修改为：

```tsx
{!isLogin && (
  <>
    {/* 注册方式切换 */}
    <div className={styles.registerModeSwitch} style={{textAlign: 'center', marginBottom: '16px'}}>
      <button 
        type="button"
        onClick={() => {
          setUseCodeRegister(!useCodeRegister)
          setCodeSent(false)
          setCountdown(0)
          setError('')
        }}
        style={{
          background: 'none',
          border: 'none',
          color: '#2563eb',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        {useCodeRegister ? '改用密码注册' : '使用验证码注册'}
      </button>
    </div>

    {/* 用户名 */}
    <label className={styles.authField}>
      <span>用户名</span>
      <input 
        name="username" 
        type="text" 
        placeholder="请设置登录用户名（字母数字）" 
        required 
        disabled={loading} 
        minLength={3} 
        maxLength={20} 
        pattern="[a-zA-Z0-9_]+" 
        title="只能包含字母、数字和下划线" 
      />
    </label>

    {/* 姓名 */}
    <label className={styles.authField}>
      <span>姓名</span>
      <input 
        name="name" 
        type="text" 
        placeholder="请输入您的真实姓名" 
        required 
        disabled={loading} 
      />
    </label>

    {/* 邮箱 */}
    <label className={styles.authField}>
      <span>邮箱</span>
      <input 
        name="email" 
        type="email" 
        placeholder="example@example.com" 
        required 
        disabled={loading} 
      />
    </label>

    {useCodeRegister ? (
      /* 验证码注册模式 */
      <>
        <label className={styles.authField}>
          <span>验证码</span>
          <div style={{display: 'flex', gap: '8px'}}>
            <input 
              name="code" 
              type="text" 
              placeholder="请输入6位验证码" 
              required 
              disabled={loading}
              maxLength={6}
              pattern="[0-9]{6}"
              style={{flex: 1}}
            />
            <button
              type="button"
              onClick={() => {
                const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement
                const email = emailInput?.value
                if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                  handleSendRegisterCode(email)
                } else {
                  setError('请先输入有效的邮箱地址')
                }
              }}
              disabled={loading || countdown > 0}
              style={{
                padding: '8px 16px',
                background: countdown > 0 ? '#ccc' : '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {countdown > 0 ? `${countdown}秒` : '发送验证码'}
            </button>
          </div>
        </label>
        <div style={{fontSize: '12px', color: '#666', marginTop: '-8px'}}>
          验证码已发送到您的邮箱，请查收
        </div>
      </>
    ) : (
      /* 密码注册模式（原有） */
      <>
        <label className={styles.authField}>
          <span>密码</span>
          <input 
            name="password" 
            type="password" 
            placeholder="请输入密码" 
            required 
            disabled={loading} 
            minLength={6} 
          />
        </label>
        <label className={styles.authField}>
          <span>确认密码</span>
          <input 
            name="confirm" 
            type="password" 
            placeholder="请再次输入密码" 
            required 
            disabled={loading} 
            minLength={6} 
          />
        </label>
      </>
    )}
  </>
)}
```

---

## 🎨 UI效果预览

### 密码注册模式（默认）
```
┌─────────────────────────────────┐
│  [使用验证码注册]               │
│                                 │
│  用户名                         │
│  ┌───────────────────────────┐  │
│  │ testuser                 │  │
│  └───────────────────────────┘  │
│                                 │
│  姓名                           │
│  ┌───────────────────────────┐  │
│  │ 测试用户                  │  │
│  └───────────────────────────┘  │
│                                 │
│  邮箱                           │
│  ┌───────────────────────────┐  │
│  │ test@example.com         │  │
│  └───────────────────────────┘  │
│                                 │
│  密码                           │
│  ┌───────────────────────────┐  │
│  │ ••••••••                 │  │
│  └───────────────────────────┘  │
│                                 │
│  确认密码                       │
│  ┌───────────────────────────┐  │
│  │ ••••••••                 │  │
│  └───────────────────────────┘  │
│                                 │
│  [注册]                         │
└─────────────────────────────────┘
```

### 验证码注册模式
```
┌─────────────────────────────────┐
│  [改用密码注册]                 │
│                                 │
│  用户名                         │
│  ┌───────────────────────────┐  │
│  │ testuser                 │  │
│  └───────────────────────────┘  │
│                                 │
│  姓名                           │
│  ┌───────────────────────────┐  │
│  │ 测试用户                  │  │
│  └───────────────────────────┘  │
│                                 │
│  邮箱                           │
│  ┌───────────────────────────┐  │
│  │ test@example.com         │  │
│  └───────────────────────────┘  │
│                                 │
│  验证码                         │
│  ┌────────────┐ ┌───────────┐  │
│  │ 123456    │ │ 发送验证码 │  │
│  └────────────┘ └───────────┘  │
│  验证码已发送到您的邮箱，请查收  │
│                                 │
│  [注册]                         │
└─────────────────────────────────┘
```

---

## 🧪 测试步骤

### 1. 验证码注册流程

1. **访问注册页面**
   ```
   http://localhost:3000/register
   ```

2. **点击"使用验证码注册"**

3. **填写信息**
   - 用户名：testuser
   - 姓名：测试用户
   - 邮箱：your-email@qq.com

4. **点击"发送验证码"**
   - 按钮变为倒计时（60秒）
   - 检查邮箱收取验证码

5. **输入验证码**
   - 填入收到的6位验证码

6. **点击"注册"**
   - 自动登录并跳转到主页

### 2. 密码注册流程（保持不变）

1. 访问注册页面
2. 保持"密码注册"模式
3. 填写用户名、姓名、邮箱、密码、确认密码
4. 点击"注册"

---

## 🔒 安全特性

### 验证码注册
- ✅ 邮箱必须未注册
- ✅ 验证码5分钟有效
- ✅ 最多3次验证尝试
- ✅ 60秒重发限制
- ✅ 用户名唯一性验证
- ✅ 自动生成随机密码（用户后续可修改）

### 密码注册（原有）
- ✅ 密码强度要求
- ✅ 确认密码验证
- ✅ 用户名和邮箱唯一性

---

## ⚙️ API测试

### 发送注册验证码
```bash
curl -X POST "http://localhost:8000/api/auth/send-code?for_register=true" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### 验证码注册
```bash
curl -X POST http://localhost:8000/api/auth/register-with-code \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "code": "123456",
    "name": "测试用户"
  }'
```

---

## 📊 完整流程图

```
用户访问注册页面
  ↓
选择注册方式
  ├─ 密码注册（默认）
  │   ├─ 填写：用户名、姓名、邮箱、密码、确认密码
  │   ├─ 点击"注册"
  │   ├─ 后端验证密码、创建账户
  │   └─ 登录成功
  │
  └─ 验证码注册
      ├─ 点击"使用验证码注册"
      ├─ 填写：用户名、姓名、邮箱
      ├─ 点击"发送验证码"
      ├─ 后端检查邮箱未注册
      ├─ 生成验证码并发送邮件
      ├─ 用户查收邮件获取验证码
      ├─ 输入验证码
      ├─ 点击"注册"
      ├─ 后端验证验证码
      ├─ 创建账户（随机密码）
      └─ 登录成功
```

---

## ✅ 完成清单

后端：
- [x] 修改send-code API支持注册模式
- [x] 添加register-with-code API
- [x] 验证码验证逻辑
- [x] 用户创建逻辑

前端API：
- [x] 添加RegisterWithCodeRequest类型
- [x] 添加registerWithCode方法

前端UI（需要实现）：
- [ ] 添加验证码注册状态管理
- [ ] 添加发送验证码函数
- [ ] 修改注册提交逻辑
- [ ] 修改注册表单UI
- [ ] 添加倒计时功能

---

## 🎉 完成！

按照本指南修改前端注册界面后，用户就可以：
1. **选择注册方式**：密码注册或验证码注册
2. **验证码注册**：更安全、更方便
3. **密码注册**：保持原有方式

祝使用愉快！📧

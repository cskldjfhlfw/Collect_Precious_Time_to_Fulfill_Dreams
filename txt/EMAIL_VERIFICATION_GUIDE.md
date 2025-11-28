# 📧 邮箱验证码登录功能使用指南

## ✅ 已完成的后端实现

### 1. 邮件发送服务
**文件**: `back/app/services/email.py`

- ✅ 使用 `aiosmtplib` 异步发送邮件
- ✅ 精美的HTML邮件模板
- ✅ 验证码邮件发送函数

### 2. 验证码管理服务
**文件**: `back/app/services/verification_code.py`

- ✅ 6位数字验证码生成
- ✅ 5分钟有效期
- ✅ 3次验证尝试限制
- ✅ 60秒重发间隔

### 3. 认证API
**文件**: `back/app/api/routes/auth.py`

新增了两个API端点：

#### POST `/api/auth/send-code`
发送验证码到邮箱

**请求体**：
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

#### POST `/api/auth/login-with-code`
使用验证码登录

**请求体**：
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**响应**：
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "username": "username",
    "email": "email@example.com",
    "role": "user"
  }
}
```

---

## 🔧 配置邮件服务

### 步骤1: 安装依赖

```bash
cd back
pip install -r requirements_email.txt
```

### 步骤2: 配置SMTP

编辑 `back/app/services/email.py`，修改邮件配置：

```python
EMAIL_CONFIG = {
    "smtp_host": "smtp.gmail.com",        # Gmail的SMTP服务器
    "smtp_port": 587,
    "smtp_user": "your-email@gmail.com",  # 你的Gmail地址
    "smtp_password": "your-app-password",  # Gmail应用专用密码
    "from_email": "your-email@gmail.com",
    "from_name": "科研成果管理系统",
}
```

### 步骤3: 获取Gmail应用专用密码

1. 访问 https://myaccount.google.com/apppasswords
2. 选择"邮件"和"其他（自定义名称）"
3. 生成密码
4. 将生成的16位密码填入 `smtp_password`

---

## 📱 前端实现指南

### 已完成的API封装

**文件**: `front/lib/api/auth.ts`

```typescript
// 发送验证码
authApi.sendCode({ email: "user@example.com" })

// 验证码登录
authApi.loginWithCode({ 
  email: "user@example.com", 
  code: "123456" 
})
```

### 前端登录页面修改建议

在 `front/app/(auth)/_components/auth-page.tsx` 中添加：

#### 1. 添加状态管理

```tsx
const [useCodeLogin, setUseCodeLogin] = useState(false)
const [codeSent, setCodeSent] = useState(false)
const [countdown, setCountdown] = useState(0)
```

#### 2. 发送验证码函数

```tsx
const handleSendCode = async (email: string) => {
  try {
    setLoading(true)
    await authApi.sendCode({ email })
    setCodeSent(true)
    setCountdown(60)
    alert('验证码已发送到您的邮箱')
    
    // 倒计时
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  } catch (error) {
    setError(error instanceof Error ? error.message : '发送验证码失败')
  } finally {
    setLoading(false)
  }
}
```

#### 3. 验证码登录函数

```tsx
const handleCodeLogin = async (email: string, code: string) => {
  try {
    setLoading(true)
    const response = await authApi.loginWithCode({ email, code })
    // 设置token和用户信息
    setToken(response.access_token)
    setUser(response.user)
    localStorage.setItem('auth_token', response.access_token)
    localStorage.setItem('auth_user', JSON.stringify(response.user))
    router.push('/papers')
  } catch (error) {
    setError(error instanceof Error ? error.message : '登录失败')
  } finally {
    setLoading(false)
  }
}
```

#### 4. 登录表单UI

```tsx
{isLogin && (
  <div className={styles.loginModeSwitch}>
    <button 
      type="button"
      onClick={() => setUseCodeLogin(!useCodeLogin)}
    >
      {useCodeLogin ? '密码登录' : '验证码登录'}
    </button>
  </div>
)}

{isLogin && useCodeLogin ? (
  <>
    {/* 邮箱输入 */}
    <label className={styles.authField}>
      <span>邮箱</span>
      <input 
        name="email" 
        type="email" 
        placeholder="请输入邮箱" 
        required 
        disabled={loading} 
      />
    </label>
    
    {/* 验证码输入 */}
    <label className={styles.authField}>
      <span>验证码</span>
      <div style={{display: 'flex', gap: '8px'}}>
        <input 
          name="code" 
          type="text" 
          placeholder="请输入验证码" 
          required 
          disabled={loading}
          maxLength={6}
        />
        <button
          type="button"
          onClick={() => {
            const email = (document.querySelector('input[name="email"]') as HTMLInputElement)?.value
            if (email) handleSendCode(email)
          }}
          disabled={loading || countdown > 0}
        >
          {countdown > 0 ? `${countdown}秒后重发` : '发送验证码'}
        </button>
      </div>
    </label>
  </>
) : (
  // 原有的用户名/密码登录表单
  ...
)}
```

---

## 🎨 UI效果

### 登录页面

```
┌──────────────────────────────────┐
│  登录到科研成果管理系统           │
├──────────────────────────────────┤
│  [密码登录] [验证码登录]          │
│                                  │
│  邮箱                            │
│  ┌────────────────────────────┐  │
│  │ user@example.com          │  │
│  └────────────────────────────┘  │
│                                  │
│  验证码                          │
│  ┌──────────────┐ ┌──────────┐  │
│  │ 123456      │ │发送验证码│  │
│  └──────────────┘ └──────────┘  │
│                                  │
│  [登录]                          │
└──────────────────────────────────┘
```

### 邮件效果

```
┌──────────────────────────────────┐
│  🔐 登录验证码                    │
├──────────────────────────────────┤
│  您好，admin！                    │
│                                  │
│  您正在尝试登录科研成果管理系统， │
│  请使用以下验证码完成登录：        │
│                                  │
│  ┌──────────────────────────┐   │
│  │      1  2  3  4  5  6    │   │
│  └──────────────────────────┘   │
│                                  │
│  ✓ 验证码有效期：5分钟           │
│  ✓ 如果不是您本人操作，请忽略    │
│                                  │
│  ⚠️ 请勿将验证码告知他人         │
└──────────────────────────────────┘
```

---

## 🔒 安全特性

1. **验证码有效期**：5分钟后自动失效
2. **尝试次数限制**：最多3次验证尝试
3. **重发限制**：60秒内不能重复发送
4. **账户状态检查**：禁用的账户不能发送验证码
5. **验证后自动销毁**：验证成功后立即删除验证码

---

## 📊 完整流程

### 用户操作流程

```
1. 用户点击"验证码登录"
   ↓
2. 输入邮箱地址
   ↓
3. 点击"发送验证码"
   ↓
4. 后端检查邮箱是否存在
   ↓
5. 生成6位验证码
   ↓
6. 发送邮件到用户邮箱
   ↓
7. 用户查收邮件，获取验证码
   ↓
8. 输入验证码
   ↓
9. 点击"登录"
   ↓
10. 后端验证验证码
    ↓
11. 验证成功，返回token
    ↓
12. 登录成功，跳转到主页
```

---

## 🧪 测试步骤

### 1. 配置邮件服务

编辑 `back/app/services/email.py` 的EMAIL_CONFIG

### 2. 重启后端

```bash
cd back
python -m uvicorn app.main:app --reload
```

### 3. 使用API测试工具测试

**发送验证码**：
```bash
curl -X POST http://localhost:8000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com"}'
```

**查收邮件**：
检查你的邮箱，应该收到验证码邮件

**验证码登录**：
```bash
curl -X POST http://localhost:8000/api/auth/login-with-code \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "code": "123456"
  }'
```

---

## ⚠️ 注意事项

### 生产环境配置

1. **使用环境变量**存储SMTP配置
2. **使用Redis**替代内存存储验证码
3. **启用SSL/TLS**加密邮件传输
4. **设置速率限制**防止滥用
5. **记录审计日志**追踪验证码使用

### 常见问题

**Q: Gmail发送失败？**
A: 需要启用"两步验证"并使用"应用专用密码"

**Q: 验证码收不到？**
A: 检查垃圾邮件箱，或查看后端日志确认发送状态

**Q: 如何使用其他邮箱服务？**
A: 修改smtp_host和smtp_port，例如：
- QQ邮箱: smtp.qq.com:587
- 163邮箱: smtp.163.com:465
- Outlook: smtp-mail.outlook.com:587

---

## 🎉 完成！

后端已经完全实现邮箱验证码登录功能，只需：
1. 配置SMTP邮件服务
2. 修改前端登录页面添加验证码登录选项
3. 测试功能是否正常

祝使用愉快！

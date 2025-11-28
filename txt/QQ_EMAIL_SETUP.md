# 📧 QQ邮箱SMTP配置指南

## 📝 步骤1: 开启QQ邮箱SMTP服务

### 1. 登录QQ邮箱
访问 https://mail.qq.com 并登录

### 2. 进入设置
点击右上角 **设置** → **账户**

### 3. 找到SMTP服务
向下滚动，找到 **POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务** 区域

### 4. 开启SMTP服务
- 找到 **SMTP服务** 或 **IMAP/SMTP服务**
- 点击 **开启** 按钮
- 会要求发送短信验证

### 5. 获取授权码
- 验证成功后，会显示一个 **授权码**
- ⚠️ **重要**：这个授权码只显示一次，请立即复制保存
- 授权码格式类似：`abcdefghijklmnop`（16位字符）

---

## 🔧 步骤2: 配置系统

### 修改配置文件

编辑 `back/app/services/email.py`，填入你的信息：

```python
EMAIL_CONFIG = {
    "smtp_host": "smtp.qq.com",
    "smtp_port": 587,  # 或使用 465（SSL）
    "smtp_user": "你的QQ号@qq.com",  # 例如：123456789@qq.com
    "smtp_password": "你的授权码",  # 刚才获取的16位授权码
    "from_email": "你的QQ号@qq.com",
    "from_name": "科研成果管理系统",
}
```

### 配置示例

```python
EMAIL_CONFIG = {
    "smtp_host": "smtp.qq.com",
    "smtp_port": 587,
    "smtp_user": "3358442372@qq.com",  # 你的QQ邮箱
    "smtp_password": "abcdefghijklmnop",  # 16位授权码（不是QQ密码！）
    "from_email": "3358442372@qq.com",
    "from_name": "科研成果管理系统",
}
```

---

## ⚙️ QQ邮箱SMTP配置参数

| 项目 | 值 |
|------|-----|
| SMTP服务器 | smtp.qq.com |
| 端口（TLS） | 587 |
| 端口（SSL） | 465 |
| 是否需要认证 | 是 |
| 用户名 | 完整QQ邮箱地址 |
| 密码 | 授权码（非QQ密码） |

---

## 🧪 步骤3: 测试邮件发送

### 方法1: 使用Python脚本测试

创建测试脚本 `test_email.py`：

```python
import asyncio
from app.services.email import send_verification_code

async def test():
    # 替换为你要测试发送的邮箱
    result = await send_verification_code(
        email="test-receiver@qq.com",  # 收件人邮箱
        code="123456",
        username="测试用户"
    )
    print(f"发送结果: {'成功' if result else '失败'}")

if __name__ == "__main__":
    asyncio.run(test())
```

运行测试：
```bash
cd back
python test_email.py
```

### 方法2: 使用API测试

启动后端服务：
```bash
cd back
python -m uvicorn app.main:app --reload
```

发送测试请求：
```bash
curl -X POST http://localhost:8000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email": "你注册的用户邮箱@qq.com"}'
```

---

## ❓ 常见问题

### Q1: 授权码在哪里找？
**A**: 
1. 登录QQ邮箱
2. 设置 → 账户
3. 找到SMTP服务，点击"开启"
4. 验证后会显示授权码

### Q2: 使用QQ密码可以吗？
**A**: ❌ **不可以！** 必须使用授权码，不是QQ密码！

### Q3: 授权码忘记了怎么办？
**A**: 
1. 回到QQ邮箱设置
2. 关闭SMTP服务
3. 重新开启SMTP服务
4. 会生成新的授权码

### Q4: 端口587和465有什么区别？
**A**: 
- **587端口**：使用STARTTLS（推荐）
- **465端口**：使用SSL加密

如果587端口连接失败，可以尝试改为465：
```python
"smtp_port": 465,
```
并在发送代码中添加：
```python
use_tls=False,  # 改为False
start_tls=False,  # 改为False  
```

### Q5: 发送失败，显示"Connection refused"
**A**: 
1. 检查SMTP服务是否已开启
2. 检查网络防火墙设置
3. 尝试使用465端口
4. 确认授权码是否正确

### Q6: 发送失败，显示"Authentication failed"
**A**: 
1. 确认使用的是授权码，不是QQ密码
2. 重新生成授权码
3. 检查smtp_user是否是完整邮箱地址

### Q7: QQ邮箱每天发送数量有限制吗？
**A**: 是的
- 免费QQ邮箱：每天约50-100封
- 如果需要更多，建议使用企业邮箱

---

## 🔒 安全建议

### 生产环境配置

**不要**将授权码硬编码在代码中！使用环境变量：

#### 1. 创建 `.env` 文件
```bash
# QQ邮箱配置
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_USER=your-email@qq.com
SMTP_PASSWORD=your-authorization-code
SMTP_FROM_EMAIL=your-email@qq.com
SMTP_FROM_NAME=科研成果管理系统
```

#### 2. 修改 `email.py`
```python
import os
from dotenv import load_dotenv

load_dotenv()

EMAIL_CONFIG = {
    "smtp_host": os.getenv("SMTP_HOST", "smtp.qq.com"),
    "smtp_port": int(os.getenv("SMTP_PORT", "587")),
    "smtp_user": os.getenv("SMTP_USER"),
    "smtp_password": os.getenv("SMTP_PASSWORD"),
    "from_email": os.getenv("SMTP_FROM_EMAIL"),
    "from_name": os.getenv("SMTP_FROM_NAME", "科研成果管理系统"),
}
```

#### 3. 安装依赖
```bash
pip install python-dotenv
```

---

## ✅ 配置检查清单

使用前请确认：

- [ ] 已登录QQ邮箱并开启SMTP服务
- [ ] 已获取16位授权码（不是QQ密码）
- [ ] 已在 `email.py` 中填入正确的邮箱和授权码
- [ ] smtp_user 使用完整邮箱地址（含@qq.com）
- [ ] 已安装 `aiosmtplib` 依赖
- [ ] 已测试邮件发送功能

---

## 🎉 完成！

配置完成后，你的系统就可以使用QQ邮箱发送验证码了！

### 测试验证码登录功能

1. 启动后端服务
2. 访问登录页面
3. 选择"验证码登录"
4. 输入邮箱，点击"发送验证码"
5. 检查QQ邮箱收取验证码
6. 输入验证码登录

---

## 📞 支持

如有问题，请检查：
1. QQ邮箱SMTP服务是否开启
2. 授权码是否正确
3. 后端日志中的错误信息
4. 网络连接是否正常

祝使用愉快！🎊

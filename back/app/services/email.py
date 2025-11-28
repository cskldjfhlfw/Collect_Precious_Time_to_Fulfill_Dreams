"""
邮件发送服务
使用 aiosmtplib 异步发送邮件
"""
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

# 邮件配置（生产环境应该从环境变量读取）
EMAIL_CONFIG = {
    "smtp_host": "smtp.qq.com",  # QQ邮箱SMTP服务器
    "smtp_port": 587,  # 使用587端口（TLS）或465端口（SSL）
    "smtp_user": "3358442371@qq.com",  # 修改为你的QQ邮箱
    "smtp_password": "cbrrppavgwxochdj",  # QQ邮箱授权码（不是QQ密码！）
    "from_email": "3358442371@qq.com",  # 发件人邮箱
    "from_name": "科研成果管理系统",
}


async def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: Optional[str] = None
) -> bool:
    """
    发送邮件
    
    Args:
        to_email: 收件人邮箱
        subject: 邮件主题
        html_content: HTML格式邮件内容
        text_content: 纯文本格式邮件内容（可选）
    
    Returns:
        是否发送成功
    """
    try:
        # 创建邮件对象
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = EMAIL_CONFIG['from_email']  # QQ邮箱要求From必须是纯邮箱地址
        message["To"] = to_email
        
        # 添加纯文本版本（如果提供）
        if text_content:
            part1 = MIMEText(text_content, "plain", "utf-8")
            message.attach(part1)
        
        # 添加HTML版本
        part2 = MIMEText(html_content, "html", "utf-8")
        message.attach(part2)
        
        # 发送邮件
        await aiosmtplib.send(
            message,
            hostname=EMAIL_CONFIG["smtp_host"],
            port=EMAIL_CONFIG["smtp_port"],
            username=EMAIL_CONFIG["smtp_user"],
            password=EMAIL_CONFIG["smtp_password"],
            start_tls=True,
        )
        
        logger.info(f"邮件发送成功: {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"邮件发送失败: {to_email}, 错误: {str(e)}")
        return False


async def send_verification_code(email: str, code: str, username: str = "") -> bool:
    """
    发送验证码邮件
    
    Args:
        email: 收件人邮箱
        code: 验证码
        username: 用户名（可选）
    
    Returns:
        是否发送成功
    """
    subject = "登录验证码 - 科研成果管理系统"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .container {{
                background-color: #f9f9f9;
                border-radius: 10px;
                padding: 30px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }}
            .header {{
                text-align: center;
                color: #2563eb;
                margin-bottom: 30px;
            }}
            .code-box {{
                background-color: #fff;
                border: 2px dashed #2563eb;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
                margin: 30px 0;
            }}
            .code {{
                font-size: 32px;
                font-weight: bold;
                color: #2563eb;
                letter-spacing: 8px;
                font-family: 'Courier New', monospace;
            }}
            .info {{
                color: #666;
                font-size: 14px;
                margin-top: 20px;
            }}
            .warning {{
                color: #dc2626;
                font-size: 13px;
                margin-top: 15px;
            }}
            .footer {{
                text-align: center;
                color: #999;
                font-size: 12px;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>🔐 登录验证码</h2>
            </div>
            
            <p>您好{f"，{username}" if username else ""}！</p>
            <p>您正在尝试登录科研成果管理系统，请使用以下验证码完成登录：</p>
            
            <div class="code-box">
                <div class="code">{code}</div>
            </div>
            
            <div class="info">
                <p>✓ 验证码有效期：<strong>5分钟</strong></p>
                <p>✓ 如果不是您本人操作，请忽略此邮件</p>
            </div>
            
            <div class="warning">
                ⚠️ 请勿将验证码告知他人，以保护您的账户安全
            </div>
            
            <div class="footer">
                <p>此邮件由系统自动发送，请勿回复</p>
                <p>© 2024 科研成果管理系统</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text_content = f"""
    您好{f"，{username}" if username else ""}！
    
    您正在尝试登录科研成果管理系统。
    
    验证码：{code}
    
    验证码有效期为5分钟。
    如果不是您本人操作，请忽略此邮件。
    
    请勿将验证码告知他人，以保护您的账户安全。
    
    此邮件由系统自动发送，请勿回复。
    """
    
    return await send_email(email, subject, html_content, text_content)

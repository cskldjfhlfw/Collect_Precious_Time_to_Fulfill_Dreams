"""
认证相关的Pydantic模型
"""
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    """用户注册"""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    name: str = Field(..., min_length=1, max_length=100)


class UserLogin(BaseModel):
    """用户登录"""
    username_or_email: str  # 可以是用户名或邮箱
    password: str


class Token(BaseModel):
    """访问令牌"""
    access_token: str
    token_type: str = "bearer"
    user: "UserInfo"


class UserInfo(BaseModel):
    """用户信息"""
    id: str
    username: str
    email: str
    role: str
    name: Optional[str] = None
    is_active: bool = True
    phone: Optional[str] = None
    region: Optional[str] = None

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    """更新用户信息"""
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    role: Optional[str] = None
    phone: Optional[str] = None
    region: Optional[str] = None


class PasswordChange(BaseModel):
    """修改密码"""
    old_password: str
    new_password: str = Field(..., min_length=6)

"""
认证API路由
"""
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr

from app.db.postgres import get_session
from app.models.tables import User
from app.schemas.auth import UserRegister, UserLogin, Token, UserInfo, PasswordChange, UserUpdate
from app.core.security import get_password_hash, verify_password, create_access_token
from app.api.deps import get_current_active_user
from app.services.email import send_verification_code
from app.services.verification_code import create_verification_code, verify_code, get_remaining_time
from app.services.token_blacklist import token_blacklist_service
from app.services.audit_log import audit_log_service

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()


class SendCodeRequest(BaseModel):
    """发送验证码请求"""
    email: EmailStr


class VerifyCodeLogin(BaseModel):
    """验证码登录请求"""
    email: EmailStr
    code: str


class RegisterWithCode(BaseModel):
    """验证码注册请求"""
    username: str
    email: EmailStr
    code: str
    password: str
    name: str


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserRegister,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_session)]
) -> Token:
    """用户注册"""
    # 检查用户名是否已存在
    result = await db.execute(
        select(User).where(User.username == user_data.username)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已被使用"
        )
    
    # 检查邮箱是否已存在
    result = await db.execute(
        select(User).where(User.email == user_data.email)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="邮箱已被注册"
        )
    
    # 检查是否为第一个用户（设为超级管理员）
    result = await db.execute(select(User))
    users = result.scalars().all()
    is_first_user = len(users) == 0
    
    # 创建新用户
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_password,
        role="superadmin" if is_first_user else "user"
    )
    
    print(f"[注册调试] 创建用户: username={user_data.username}, email={user_data.email}")
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    print(f"[注册调试] 用户已保存: id={new_user.id}, username={new_user.username}")
    
    # 生成访问令牌
    access_token = create_access_token(data={"sub": str(new_user.id)})
    
    # 记录注册日志
    await audit_log_service.log_action(
        user_id=str(new_user.id),
        action="register",
        resource_type="user",
        resource_id=str(new_user.id),
        changes={"after": {"username": new_user.username, "email": new_user.email, "role": new_user.role}},
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        status="success"
    )
    
    return Token(
        access_token=access_token,
        user=UserInfo(
            id=str(new_user.id),
            username=new_user.username,
            email=new_user.email,
            role=new_user.role,
            name=user_data.name
        )
    )


@router.post("/login", response_model=Token)
async def login(
    user_data: UserLogin,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_session)]
) -> Token:
    """用户登录（支持用户名或邮箱）"""
    print(f"[登录调试] 尝试登录: {user_data.username_or_email}")
    
    # 查询用户（尝试用户名或邮箱）
    result = await db.execute(
        select(User).where(
            (User.email == user_data.username_or_email) |
            (User.username == user_data.username_or_email)
        )
    )
    user = result.scalar_one_or_none()
    
    if user:
        print(f"[登录调试] 找到用户: username={user.username}, email={user.email}")
    else:
        print(f"[登录调试] 未找到用户: {user_data.username_or_email}")
    
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名/邮箱或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 检查账户是否被禁用
    if hasattr(user, 'is_active') and not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="账户已被禁用，请联系管理员",
        )
    
    # 生成访问令牌
    access_token = create_access_token(data={"sub": str(user.id)})
    
    # 记录登录日志
    await audit_log_service.log_action(
        user_id=str(user.id),
        action="login",
        resource_type="user",
        resource_id=str(user.id),
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        status="success"
    )
    
    return Token(
        access_token=access_token,
        user=UserInfo(
            id=str(user.id),
            username=user.username,
            email=user.email,
            role=user.role
        )
    )


@router.get("/me", response_model=UserInfo)
async def get_current_user_info(
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """获取当前用户信息"""
    return UserInfo(
        id=str(current_user.id),
        username=current_user.username,
        email=current_user.email,
        role=current_user.role,
        phone=current_user.phone,
        region=current_user.region
    )


@router.post("/change-password")
async def change_password(
    password_data: PasswordChange,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_session)]
):
    """修改密码"""
    # 验证旧密码
    if not verify_password(password_data.old_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="旧密码错误"
        )
    
    # 更新密码
    current_user.password_hash = get_password_hash(password_data.new_password)
    await db.commit()
    
    return {"message": "密码修改成功"}


@router.patch("/me", response_model=UserInfo)
async def update_current_user(
    user_data: UserUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_session)]
):
    """更新当前用户信息"""
    # 检查用户名是否被占用
    if user_data.username and user_data.username != current_user.username:
        result = await db.execute(
            select(User).where(User.username == user_data.username)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="用户名已被使用"
            )
        current_user.username = user_data.username
    
    # 检查邮箱是否被占用
    if user_data.email and user_data.email != current_user.email:
        result = await db.execute(
            select(User).where(User.email == user_data.email)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邮箱已被注册"
            )
        current_user.email = user_data.email
    
    # 更新手机号
    if user_data.phone is not None:
        current_user.phone = user_data.phone
    
    # 更新地区
    if user_data.region is not None:
        current_user.region = user_data.region
    
    await db.commit()
    await db.refresh(current_user)
    
    return UserInfo(
        id=str(current_user.id),
        username=current_user.username,
        email=current_user.email,
        role=current_user.role,
        phone=current_user.phone,
        region=current_user.region
    )


@router.post("/send-code")
async def send_code(
    request: SendCodeRequest,
    db: Annotated[AsyncSession, Depends(get_session)],
    for_register: bool = False  # 是否用于注册
):
    """发送验证码到邮箱（登录或注册）"""
    # 检查邮箱是否已注册
    result = await db.execute(
        select(User).where(User.email == request.email)
    )
    user = result.scalar_one_or_none()
    
    if for_register:
        # 注册：邮箱不能已存在
        if user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="该邮箱已被注册"
            )
        username_for_email = "新用户"
    else:
        # 登录：邮箱必须存在
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="该邮箱未注册"
            )
        username_for_email = user.username
    
        # 登录时检查账户是否被禁用
        if hasattr(user, 'is_active') and not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="账户已被禁用，请联系管理员"
            )
    
    # 创建验证码
    code, success = await create_verification_code(request.email)
    
    if not success:
        # 获取剩余时间
        remaining = await get_remaining_time(request.email)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"请勿频繁发送验证码，请等待{remaining}秒后重试"
        )
    
    # 发送邮件
    email_sent = await send_verification_code(request.email, code, username_for_email)
    
    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="邮件发送失败，请稍后重试"
        )
    
    return {
        "message": "验证码已发送到您的邮箱",
        "expires_in": 300  # 5分钟
    }


@router.post("/login-with-code", response_model=Token)
async def login_with_code(
    login_data: VerifyCodeLogin,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_session)]
) -> Token:
    """使用邮箱验证码登录"""
    # 验证验证码
    valid, error_msg = await verify_code(login_data.email, login_data.code)
    
    if not valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )
    
    # 查询用户
    result = await db.execute(
        select(User).where(User.email == login_data.email)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    # 检查账户是否被禁用
    if hasattr(user, 'is_active') and not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="账户已被禁用，请联系管理员"
        )
    
    # 生成访问令牌
    access_token = create_access_token(data={"sub": str(user.id)})
    
    # 记录验证码登录日志
    await audit_log_service.log_action(
        user_id=str(user.id),
        action="login",
        resource_type="user",
        resource_id=str(user.id),
        changes={"after": {"login_method": "verification_code"}},
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        status="success"
    )
    
    return Token(
        access_token=access_token,
        user=UserInfo(
            id=str(user.id),
            username=user.username,
            email=user.email,
            role=user.role
        )
    )


@router.post("/register-with-code", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register_with_code(
    register_data: RegisterWithCode,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_session)]
) -> Token:
    """使用邮箱验证码注册"""
    # 验证验证码
    valid, error_msg = await verify_code(register_data.email, register_data.code)
    
    if not valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )
    
    # 检查用户名是否已存在
    result = await db.execute(
        select(User).where(User.username == register_data.username)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已被使用"
        )
    
    # 检查邮箱是否已存在（双重验证）
    result = await db.execute(
        select(User).where(User.email == register_data.email)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="邮箱已被注册"
        )
    
    # 检查是否为第一个用户（设为超级管理员）
    result = await db.execute(select(User))
    users = result.scalars().all()
    is_first_user = len(users) == 0
    
    # 创建新用户（使用用户提供的密码）
    hashed_password = get_password_hash(register_data.password)
    
    new_user = User(
        username=register_data.username,
        email=register_data.email,
        password_hash=hashed_password,
        role="superadmin" if is_first_user else "user"
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    # 生成访问令牌
    access_token = create_access_token(data={"sub": str(new_user.id)})
    
    # 记录验证码注册日志
    await audit_log_service.log_action(
        user_id=str(new_user.id),
        action="register",
        resource_type="user",
        resource_id=str(new_user.id),
        changes={"after": {"username": new_user.username, "email": new_user.email, "role": new_user.role, "method": "verification_code"}},
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        status="success"
    )
    
    return Token(
        access_token=access_token,
        user=UserInfo(
            id=str(new_user.id),
            username=new_user.username,
            email=new_user.email,
            role=new_user.role,
            name=register_data.name
        )
    )


@router.post("/logout")
async def logout(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """用户登出
    
    将当前token加入黑名单，使其立即失效
    """
    token = credentials.credentials
    
    # 将token加入黑名单
    success = await token_blacklist_service.add_to_blacklist(
        token=token,
        reason="logout"
    )
    
    if success:
        return {
            "message": "登出成功",
            "detail": "Token已失效"
        }
    else:
        # 即使加入黑名单失败也返回成功（优雅降级）
        return {
            "message": "登出成功",
            "detail": "Token已失效（降级模式）"
        }


@router.post("/revoke-token")
async def revoke_token(
    token_to_revoke: str,
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """撤销指定token（管理员功能）
    
    管理员可以撤销任何用户的token
    """
    # 只允许管理员执行
    if current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理员权限"
        )
    
    # 将token加入黑名单
    success = await token_blacklist_service.add_to_blacklist(
        token=token_to_revoke,
        reason="revoked_by_admin"
    )
    
    if success:
        return {
            "message": "Token已撤销",
            "detail": "指定的token已被加入黑名单"
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="撤销token失败"
        )


@router.get("/blacklist/count")
async def get_blacklist_count(
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """获取黑名单中的token数量（管理员功能）"""
    # 只允许管理员查看
    if current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理员权限"
        )
    
    count = await token_blacklist_service.get_blacklist_count()
    
    return {
        "blacklist_count": count,
        "message": f"黑名单中有 {count} 个token"
    }

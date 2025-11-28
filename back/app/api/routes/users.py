"""
用户管理API路由（超级管理员）
"""
from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID

from app.db.postgres import get_session
from app.models.tables import User, Paper
from app.schemas.auth import UserInfo, UserUpdate
from app.api.deps import get_current_superadmin_user
from app.core.security import get_password_hash
from app.services.audit_log import audit_log_service

router = APIRouter(prefix="/users", tags=["用户管理"])


@router.get("/", response_model=dict)
async def get_users(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    search: str = Query(None),
    role: str = Query(None),
    current_user: User = Depends(get_current_superadmin_user),
    db: AsyncSession = Depends(get_session)
):
    """获取用户列表（超级管理员）"""
    # 构建查询
    query = select(User)
    
    # 搜索过滤
    if search:
        query = query.where(
            (User.username.ilike(f"%{search}%")) |
            (User.email.ilike(f"%{search}%"))
        )
    
    # 角色过滤
    if role:
        query = query.where(User.role == role)
    
    # 计算总数
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()
    
    # 分页查询
    query = query.limit(size).offset((page - 1) * size).order_by(User.created_at.desc())
    result = await db.execute(query)
    users = result.scalars().all()
    
    return {
        "items": [
            UserInfo(
                id=str(user.id),
                username=user.username,
                email=user.email,
                role=user.role,
                is_active=getattr(user, 'is_active', True)
            )
            for user in users
        ],
        "total": total,
        "page": page,
        "size": size,
        "pages": (total + size - 1) // size
    }


@router.get("/{user_id}", response_model=UserInfo)
async def get_user(
    user_id: UUID,
    current_user: User = Depends(get_current_superadmin_user),
    db: AsyncSession = Depends(get_session)
):
    """获取用户详情（超级管理员）"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    return UserInfo(
        id=str(user.id),
        username=user.username,
        email=user.email,
        role=user.role
    )


@router.patch("/{user_id}", response_model=UserInfo)
async def update_user(
    user_id: UUID,
    user_data: UserUpdate,
    request: Request,
    current_user: User = Depends(get_current_superadmin_user),
    db: AsyncSession = Depends(get_session)
):
    """更新用户信息（超级管理员）"""
    # 查询用户
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    # 不能修改自己的角色
    if user.id == current_user.id and user_data.role and user_data.role != user.role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不能修改自己的角色"
        )
    
    # 检查用户名是否被占用
    if user_data.username and user_data.username != user.username:
        result = await db.execute(
            select(User).where(User.username == user_data.username)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="用户名已被使用"
            )
        user.username = user_data.username
    
    # 检查邮箱是否被占用
    if user_data.email and user_data.email != user.email:
        result = await db.execute(
            select(User).where(User.email == user_data.email)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邮箱已被注册"
            )
        user.email = user_data.email
    
    # 更新角色
    if user_data.role:
        user.role = user_data.role
    
    # 更新手机号
    if user_data.phone is not None:
        user.phone = user_data.phone
    
    # 更新地区
    if user_data.region is not None:
        user.region = user_data.region
    
    try:
        # 保存更新前数据
        old_data = {"username": user.username, "email": user.email, "role": user.role}
        
        await db.commit()
        await db.refresh(user)
        
        # 记录日志
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="update",
            resource_type="user",
            resource_id=str(user_id),
            changes={
                "before": old_data,
                "after": {"username": user.username, "email": user.email, "role": user.role}
            },
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            status="success"
        )
    except Exception as e:
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="update",
            resource_type="user",
            resource_id=str(user_id),
            status="failed",
            error_message=str(e),
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        raise
    
    return UserInfo(
        id=str(user.id),
        username=user.username,
        email=user.email,
        role=user.role,
        phone=user.phone,
        region=user.region
    )


@router.delete("/{user_id}")
async def delete_user(
    user_id: UUID,
    request: Request,
    current_user: User = Depends(get_current_superadmin_user),
    db: AsyncSession = Depends(get_session)
):
    """删除用户（超级管理员）"""
    # 查询用户
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    # 不能删除自己
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不能删除自己"
        )
    
    # 检查用户是否有关联数据
    papers_count_result = await db.execute(
        select(func.count(Paper.id)).where(Paper.created_by == user_id)
    )
    papers_count = papers_count_result.scalar()
    
    if papers_count > 0:
        # 有关联数据，禁用账户而不是删除
        user.is_active = False
        # 重置密码为随机值，确保无法登录
        import secrets
        user.password_hash = get_password_hash(secrets.token_urlsafe(32))
        await db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"该用户创建了 {papers_count} 篇论文，无法删除。账户已被禁用，用户将无法登录。"
        )
    
    # 没有关联数据，可以安全删除
    try:
        deleted_data = {"username": user.username, "email": user.email, "role": user.role}
        await db.delete(user)
        await db.commit()
        
        # 记录日志
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="delete",
            resource_type="user",
            resource_id=str(user_id),
            changes={"before": deleted_data},
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            status="success"
        )
        
        return {"message": "用户删除成功"}
    except Exception as e:
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="delete",
            resource_type="user",
            resource_id=str(user_id),
            status="failed",
            error_message=str(e),
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        raise


@router.post("/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: UUID,
    current_user: User = Depends(get_current_superadmin_user),
    db: AsyncSession = Depends(get_session)
):
    """启用/禁用用户账户（超级管理员）"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    # 不能禁用自己
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不能禁用自己的账户"
        )
    
    # 切换激活状态
    user.is_active = not user.is_active
    await db.commit()
    
    status_text = "启用" if user.is_active else "禁用"
    return {
        "message": f"账户已{status_text}",
        "is_active": user.is_active
    }


@router.post("/{user_id}/reset-password")
async def reset_user_password(
    user_id: UUID,
    new_password: str,
    request: Request,
    current_user: User = Depends(get_current_superadmin_user),
    db: AsyncSession = Depends(get_session)
):
    """重置用户密码（超级管理员）"""
    # 查询用户
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    # 更新密码
    try:
        user.password_hash = get_password_hash(new_password)
        await db.commit()
        
        # 记录日志（不记录密码内容）
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="reset_password",
            resource_type="user",
            resource_id=str(user_id),
            changes={"after": {"action": "password_reset"}},
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            status="success"
        )
        
        return {"message": "密码重置成功"}
    except Exception as e:
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="reset_password",
            resource_type="user",
            resource_id=str(user_id),
            status="failed",
            error_message=str(e),
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        raise

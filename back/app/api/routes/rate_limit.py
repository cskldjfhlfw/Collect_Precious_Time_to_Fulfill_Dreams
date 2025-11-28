"""限流管理API"""
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Request

from app.api.deps import get_current_admin_user
from app.models.tables import User
from app.services.rate_limiter import rate_limiter

router = APIRouter(prefix="/rate-limit", tags=["Rate Limiting"])


@router.get("/info")
async def get_my_rate_limit_info(
    request: Request,
) -> Any:
    """获取当前用户/IP的限流信息"""
    
    # 获取客户端IP
    client_ip = request.client.host if request.client else "unknown"
    
    # 获取IP限流信息
    ip_info = await rate_limiter.get_rate_limit_info(
        identifier=client_ip,
        limit_type="per_ip"
    )
    
    return {
        "ip": client_ip,
        "rate_limit": ip_info,
        "message": "当前IP的限流状态"
    }


@router.get("/stats")
async def get_rate_limit_stats(
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    """获取全局限流统计（管理员）"""
    
    stats = await rate_limiter.get_all_rate_limits()
    
    return {
        "stats": stats,
        "limits": {
            "global": "1000次/分钟",
            "per_user": "100次/分钟",
            "per_ip": "200次/分钟",
            "auth": "10次/分钟",
            "search": "30次/分钟",
        }
    }


@router.delete("/reset/{identifier}")
async def reset_rate_limit(
    identifier: str,
    limit_type: str = "per_ip",
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    """重置指定标识符的限流（管理员）"""
    
    success = await rate_limiter.reset_rate_limit(
        identifier=identifier,
        limit_type=limit_type
    )
    
    if success:
        return {
            "message": "限流已重置",
            "identifier": identifier,
            "limit_type": limit_type
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="重置限流失败"
        )

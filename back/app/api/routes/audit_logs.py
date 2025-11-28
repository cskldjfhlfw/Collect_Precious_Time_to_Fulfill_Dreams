"""操作日志API"""
from typing import Any, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request

from app.api.deps import get_current_user, get_current_admin_user
from app.models.tables import User
from app.services.audit_log import audit_log_service

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


@router.get("/my")
async def get_my_logs(
    limit: int = 50,
    skip: int = 0,
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    current_user: User = Depends(get_current_user)
) -> Any:
    """获取我的操作日志"""
    try:
        logs = await audit_log_service.get_user_logs(
            user_id=str(current_user.id),
            limit=limit,
            skip=skip,
            action=action,
            resource_type=resource_type
        )
        
        return {
            "logs": logs,
            "total": len(logs)
        }
    except Exception as e:
        print(f"获取日志失败: {e}")
        return {"logs": [], "total": 0}


@router.get("/recent")
async def get_recent_logs(
    limit: int = 100,
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    """获取最近操作日志（管理员）"""
    try:
        logs = await audit_log_service.get_recent_logs(
            limit=limit,
            action=action,
            resource_type=resource_type,
            status=status
        )
        
        return {
            "logs": logs,
            "total": len(logs)
        }
    except Exception as e:
        print(f"获取日志失败: {e}")
        return {"logs": [], "total": 0}


@router.get("/resource/{resource_type}/{resource_id}")
async def get_resource_logs(
    resource_type: str,
    resource_id: str,
    limit: int = 50,
    current_user: User = Depends(get_current_user)
) -> Any:
    """获取资源操作历史"""
    try:
        logs = await audit_log_service.get_resource_logs(
            resource_type=resource_type,
            resource_id=resource_id,
            limit=limit
        )
        
        return {
            "logs": logs,
            "total": len(logs),
            "resource_type": resource_type,
            "resource_id": resource_id
        }
    except Exception as e:
        print(f"获取资源日志失败: {e}")
        return {"logs": [], "total": 0}


@router.get("/statistics")
async def get_log_statistics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    """获取日志统计（管理员）"""
    try:
        start = datetime.fromisoformat(start_date) if start_date else None
        end = datetime.fromisoformat(end_date) if end_date else None
        
        stats = await audit_log_service.get_statistics(
            start_date=start,
            end_date=end
        )
        
        return stats
    except Exception as e:
        print(f"获取统计失败: {e}")
        return {"total": 0, "by_action": {}, "by_resource": {}}


@router.get("/search")
async def search_logs(
    q: str,
    limit: int = 50,
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    """搜索日志（管理员）"""
    try:
        logs = await audit_log_service.search_logs(
            keyword=q,
            limit=limit
        )
        
        return {
            "logs": logs,
            "total": len(logs),
            "query": q
        }
    except Exception as e:
        print(f"搜索日志失败: {e}")
        return {"logs": [], "total": 0}


@router.post("/clean")
async def clean_old_logs(
    days: int = 90,
    current_user: User = Depends(get_current_admin_user)
) -> Any:
    """清理旧日志（管理员）"""
    try:
        deleted_count = await audit_log_service.clean_old_logs(days=days)
        
        return {
            "message": f"已清理 {deleted_count} 条日志",
            "deleted_count": deleted_count,
            "days": days
        }
    except Exception as e:
        print(f"清理日志失败: {e}")
        raise HTTPException(status_code=500, detail="清理失败")


@router.post("/log")
async def create_manual_log(
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    changes: Optional[dict] = None,
    request: Request = None,
    current_user: User = Depends(get_current_user)
) -> Any:
    """手动创建日志记录（用于特殊场景）"""
    try:
        # 获取IP和User-Agent
        ip_address = request.client.host if request else None
        user_agent = request.headers.get("user-agent") if request else None
        
        log_id = await audit_log_service.log_action(
            user_id=str(current_user.id),
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            changes=changes,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        return {
            "message": "日志记录成功",
            "log_id": log_id
        }
    except Exception as e:
        print(f"记录日志失败: {e}")
        raise HTTPException(status_code=500, detail="记录失败")

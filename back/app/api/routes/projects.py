from typing import Any, Annotated
from uuid import UUID
import shutil
import subprocess
import psutil
import os
from pathlib import Path
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import crud_project
from app.db.postgres import get_session
from app.api.deps import get_current_admin_user, get_current_user
from app.models.tables import User
from app.services.audit_log import audit_log_service
from app.core.config import settings
from app.schemas.common import PaginatedResponse, PaginationParams, StatsResponse
from app.schemas.projects import (
    ProjectCreate,
    ProjectListItem,
    ProjectMilestoneResponse,
    ProjectResponse,
    ProjectUpdate,
)

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("/", response_model=PaginatedResponse[ProjectListItem])
async def get_projects(
    pagination: PaginationParams = Depends(),
    status: str = Query(None, description="Filter by status"),
    priority: str = Query(None, description="Filter by priority"),
    project_type: str = Query(None, description="Filter by project type"),
    search: str = Query(None, description="Search keyword"),
    db: AsyncSession = Depends(get_session),
) -> Any:
    """获取项目列表"""
    filters = {}
    if status:
        filters["status"] = status
    if priority:
        filters["priority"] = priority
    if project_type:
        filters["project_type"] = project_type

    # 如果有搜索关键词，优先使用搜索逻辑
    if search:
        projects = await crud_project.search(
            db,
            query=search,
            skip=pagination.offset,
            limit=pagination.size,
        )
        total = len(projects)
    else:
        projects = await crud_project.get_multi(
            db, skip=pagination.offset, limit=pagination.size, filters=filters
        )
        total = await crud_project.count(db, filters=filters)

    items = [
        ProjectListItem(
            id=project.id,
            name=project.name,
            project_number=project.project_number,
            project_type=project.project_type,
            status=project.status,
            progress_percent=project.progress_percent,
            budget=project.budget,
            budget_used=project.budget_used,
            start_date=project.start_date,
            end_date=project.end_date,
            priority=project.priority,
        )
        for project in projects
    ]

    return PaginatedResponse(
        items=items,
        total=total,
        page=pagination.page,
        size=pagination.size,
        pages=(total + pagination.size - 1) // pagination.size,
    )


@router.get("/stats", response_model=list[StatsResponse])
async def get_project_stats(db: AsyncSession = Depends(get_session)) -> Any:
    """获取项目统计数据"""
    stats = await crud_project.get_stats(db)
    
    return [
        StatsResponse(label="总项目数", value=stats["total"], change="+3", trend="up"),
        StatsResponse(label="进行中", value=stats["active"], change="+2", trend="up"),
        StatsResponse(label="已完成", value=stats["completed"], change="+1", trend="up"),
        StatsResponse(label="规划中", value=stats["planning"], change="0", trend="stable"),
    ]


@router.get("/budget-summary")
async def get_budget_summary(db: AsyncSession = Depends(get_session)) -> Any:
    """获取预算汇总"""
    return await crud_project.get_budget_summary(db)


@router.get("/{project_id}/milestones", response_model=list[ProjectMilestoneResponse])
async def get_project_milestones(
    project_id: UUID,
    pagination: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_session),
) -> Any:
    """获取项目里程碑"""
    return await crud_project.get_milestones(
        db, project_id=str(project_id), skip=pagination.offset, limit=pagination.size
    )


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: UUID,
    db: AsyncSession = Depends(get_session),
) -> Any:
    """获取项目详情"""
    project = await crud_project.get(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("/{project_id}/detail", response_model=ProjectResponse)
async def get_project_detail(
    project_id: UUID,
    db: AsyncSession = Depends(get_session),
) -> Any:
    """
    获取项目完整详情（包含图片路径等）
    用于详情视图，按需加载
    """
    project = await crud_project.get(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("/{project_id}/image")
async def get_project_image(
    project_id: UUID,
    db: AsyncSession = Depends(get_session),
) -> Any:
    """
    获取项目图片
    支持相对路径（uploads文件夹）和绝对路径
    """
    project = await crud_project.get(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if not project.image_path:
        raise HTTPException(status_code=404, detail="No image attached to this project")
    
    # 检查文件是否存在
    image_path_str = project.image_path
    
    # 处理路径：移除前导斜杠（如果有）
    if image_path_str.startswith('/'):
        image_path_str = image_path_str[1:]
    
    image_path = Path(image_path_str)
    
    # 如果是相对路径，从当前文件所在目录的父目录开始（即back目录）
    if not image_path.is_absolute():
        # 获取back目录的路径（当前文件在back/app/api/routes/，需要4个parent）
        back_dir = Path(__file__).parent.parent.parent.parent
        image_path = back_dir / image_path
    
    # 空行保持代码间距
    
    if not image_path.exists():
        raise HTTPException(status_code=404, detail=f"Image not found: {image_path}")
    
    if not image_path.is_file():
        raise HTTPException(status_code=400, detail="Invalid image path")
    
    # 根据文件扩展名设置正确的media_type
    ext = image_path.suffix.lower()
    media_type_map = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.bmp': 'image/bmp',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
    }
    media_type = media_type_map.get(ext, 'image/jpeg')
    
    return FileResponse(
        path=str(image_path),
        media_type=media_type,
        headers={
            "Cache-Control": "public, max-age=3600"
        }
    )


@router.post("/upload-file")
async def upload_project_file(
    file: UploadFile = File(...),
    file_type: str = Query(..., description="文件类型：image"),
    current_user: Annotated[User, Depends(get_current_admin_user)] = None,
) -> Any:
    """
    上传项目文件（图片）
    
    文件会被保存到 uploads/images 文件夹
    文件名格式：原文件名_时间戳.扩展名
    
    返回服务器上的文件相对路径
    """
    try:
        # 验证文件类型
        if file_type != "image":
            raise HTTPException(status_code=400, detail="文件类型必须是 image")
        
        # 获取文件扩展名
        file_extension = Path(file.filename).suffix
        
        # 验证文件扩展名
        allowed_extensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg"]
        
        if file_extension.lower() not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"不支持的文件格式。允许的格式：{', '.join(allowed_extensions)}"
            )
        
        # 创建上传目录
        base_upload_dir = Path("uploads") / "images"
        base_upload_dir.mkdir(parents=True, exist_ok=True)
        
        # 生成新文件名：原文件名（不含扩展名）+ 时间戳 + 扩展名
        original_name = Path(file.filename).stem
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")[:-3]  # 精确到毫秒
        new_filename = f"{original_name}_{timestamp}{file_extension}"
        
        # 完整文件路径
        file_path = base_upload_dir / new_filename
        
        # 保存文件
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # 返回相对路径（用于存储到数据库）
        relative_path = str(file_path).replace("\\", "/")
        
        return {
            "success": True,
            "file_path": relative_path,
            "original_filename": file.filename,
            "new_filename": new_filename,
            "file_type": file_type,
            "message": "文件上传成功"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文件上传失败：{str(e)}")


@router.post("/", response_model=ProjectResponse)
async def create_project(
    project_in: ProjectCreate,
    request: Request,
    current_user: Annotated[User, Depends(get_current_admin_user)],
    db: AsyncSession = Depends(get_session),
) -> Any:
    """创建项目（需要管理员权限）"""
    try:
        project = await crud_project.create(db, obj_in=project_in)
        
        # 记录日志
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="create",
            resource_type="project",
            resource_id=str(project.id),
            changes={
                "after": {
                    "name": project.name,
                    "status": project.status,
                    "project_type": project.project_type
                }
            },
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            status="success"
        )
        
        return project
    except Exception as e:
        import logging
        logging.error(f"创建项目失败: {str(e)}")
        
        # 记录失败日志
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="create",
            resource_type="project",
            status="failed",
            error_message=str(e),
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        
        raise HTTPException(status_code=400, detail=f"创建项目失败: {str(e)}")


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: UUID,
    project_in: ProjectUpdate,
    request: Request,
    current_user: Annotated[User, Depends(get_current_admin_user)],
    db: AsyncSession = Depends(get_session),
) -> Any:
    """更新项目（需要管理员权限）"""
    project = await crud_project.get(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    try:
        # 保存更新前数据
        old_data = {
            "name": project.name,
            "status": project.status,
            "project_type": project.project_type
        }
        
        updated_project = await crud_project.update(db, db_obj=project, obj_in=project_in)
        
        # 记录日志
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="update",
            resource_type="project",
            resource_id=str(project_id),
            changes={
                "before": old_data,
                "after": {
                    "name": updated_project.name,
                    "status": updated_project.status,
                    "project_type": updated_project.project_type
                }
            },
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            status="success"
        )
        
        return updated_project
    except Exception as e:
        # 记录失败日志
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="update",
            resource_type="project",
            resource_id=str(project_id),
            status="failed",
            error_message=str(e),
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        raise


@router.delete("/{project_id}")
async def delete_project(
    project_id: UUID,
    request: Request,
    current_user: Annotated[User, Depends(get_current_admin_user)],
    db: AsyncSession = Depends(get_session),
) -> Any:
    """删除项目（需要管理员权限）"""
    project = await crud_project.get(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    try:
        # 保存删除前数据
        deleted_data = {
            "name": project.name,
            "status": project.status,
            "project_type": project.project_type
        }
        
        # 删除相关的里程碑记录
        from sqlalchemy import delete, select
        from app.models.tables import ProjectMilestone
        
        # 先删除项目里程碑
        delete_milestones_stmt = delete(ProjectMilestone).where(ProjectMilestone.project_id == project_id)
        await db.execute(delete_milestones_stmt)
        await db.commit()
        
        # 然后删除项目
        deleted_project = await crud_project.remove(db, id=project_id)
        
        # 记录日志
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="delete",
            resource_type="project",
            resource_id=str(project_id),
            changes={"before": deleted_data},
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            status="success"
        )
        
        return {"message": "Project deleted successfully"}
    except Exception as e:
        # 记录失败日志
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="delete",
            resource_type="project",
            resource_id=str(project_id),
            status="failed",
            error_message=str(e),
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        raise


@router.post("/{project_id}/start")
async def start_project(
    project_id: UUID,
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_session),
) -> Any:
    """
    启动项目
    - 管理员：直接启动，默认1小时后自动关闭
    - 普通用户：留空，后续实现申请流程
    """
    project = await crud_project.get(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    try:
        # 检查用户角色
        is_admin = current_user.role in ["admin", "superadmin"]
        
        if is_admin:
            # 管理员直接启动逻辑
            from app.models.tables import ProjectStartupRequest
            
            # 从配置获取启动时长（小时）
            startup_duration_hours = settings.project_startup_duration_hours
            
            # 计算自动关闭时间（使用UTC时区）
            start_time = datetime.now(timezone.utc)
            end_time = start_time + timedelta(hours=startup_duration_hours)
            
            # 执行启动命令（如果项目配置了启动脚本）
            process_id = None
            startup_success = True
            startup_message = "项目启动成功"
            
            # 添加详细的调试信息
            print(f"🔍 调试信息:")
            print(f"  - 项目ID: {project_id}")
            print(f"  - 项目名称: {project.name}")
            print(f"  - 是否有startup_script_path属性: {hasattr(project, 'startup_script_path')}")
            if hasattr(project, 'startup_script_path'):
                print(f"  - startup_script_path值: {project.startup_script_path}")
            
            if hasattr(project, 'startup_script_path') and project.startup_script_path:
                try:
                    # 从项目启动脚本路径字段获取启动脚本路径
                    script_path = Path(project.startup_script_path)
                    print(f"  - 脚本路径对象: {script_path}")
                    print(f"  - 脚本路径存在: {script_path.exists()}")
                    print(f"  - 是文件: {script_path.is_file()}")
                    
                    if script_path.exists() and script_path.is_file():
                        # 根据文件扩展名选择执行方式
                        if script_path.suffix.lower() == '.bat':
                            # Windows批处理文件
                            print(f"  - 开始执行批处理文件: {script_path}")
                            print(f"  - 工作目录: {script_path.parent}")
                            print(f"  - 执行命令: ['cmd.exe', '/c', '{script_path}']")
                            
                            process = subprocess.Popen(
                                ['cmd.exe', '/c', str(script_path)],
                                cwd=script_path.parent,
                                stdout=subprocess.PIPE,
                                stderr=subprocess.PIPE,
                                creationflags=subprocess.CREATE_NEW_CONSOLE if hasattr(subprocess, 'CREATE_NEW_CONSOLE') else 0,
                                env=dict(os.environ)  # 继承环境变量
                            )
                            print(f"  - 进程创建成功，PID: {process.pid}")
                        elif script_path.suffix.lower() == '.ps1':
                            # PowerShell脚本
                            process = subprocess.Popen(
                                ['powershell.exe', '-ExecutionPolicy', 'Bypass', '-File', str(script_path)],
                                cwd=script_path.parent,
                                stdout=subprocess.PIPE,
                                stderr=subprocess.PIPE,
                                creationflags=subprocess.CREATE_NEW_CONSOLE if hasattr(subprocess, 'CREATE_NEW_CONSOLE') else 0,
                                env=dict(os.environ)  # 继承环境变量
                            )
                        elif script_path.suffix.lower() == '.sh':
                            # Shell脚本 (Linux/macOS)
                            process = subprocess.Popen(
                                ['bash', str(script_path)],
                                cwd=script_path.parent,
                                stdout=subprocess.PIPE,
                                stderr=subprocess.PIPE,
                                env=dict(os.environ)  # 继承环境变量
                            )
                        else:
                            raise ValueError(f"不支持的脚本类型: {script_path.suffix}")
                        
                        process_id = process.pid
                        startup_message = f"项目启动成功，进程ID: {process_id}，脚本路径: {script_path}"
                        
                        # 等待一下让进程初始化
                        import time
                        time.sleep(1)
                        
                        # 检查进程是否还在运行
                        if psutil.pid_exists(process_id):
                            startup_message += " (进程运行正常)"
                        else:
                            startup_message += " (警告：进程可能已退出)"
                        
                    else:
                        startup_message = f"项目启动成功（启动脚本未找到: {script_path}）"
                        print(f"  - 启动脚本未找到或不是文件")
                        
                except Exception as script_error:
                    print(f"❌ 执行启动脚本失败: {str(script_error)}")
                    print(f"  - 错误类型: {type(script_error).__name__}")
                    print(f"  - 错误详情: {str(script_error)}")
                    startup_message = f"项目启动成功（启动脚本执行失败: {str(script_error)}）"
            else:
                print(f"  - 未配置启动脚本路径")
                startup_message = "项目启动成功（未配置启动脚本）"
            
            # 创建启动记录
            startup_request = ProjectStartupRequest(
                project_id=project_id,
                requester_id=current_user.id,
                approver_id=current_user.id,
                request_reason="管理员直接启动",
                status="approved",
                approved_at=start_time,
                started_at=start_time,
                expires_at=end_time,
                process_id=process_id,
                is_running=True
            )
            
            db.add(startup_request)
            await db.commit()
            await db.refresh(startup_request)
            
            # 记录审计日志
            await audit_log_service.log_action(
                user_id=str(current_user.id),
                action="start",
                resource_type="project",
                resource_id=str(project_id),
                changes={
                    "startup_duration_hours": startup_duration_hours,
                    "start_time": start_time.isoformat(),
                    "end_time": end_time.isoformat(),
                    "auto_shutdown": True
                },
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent"),
                status="success"
            )
            
            return {
                "message": startup_message,
                "startup_id": str(startup_request.id),
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "duration_hours": startup_duration_hours,
                "auto_shutdown": True,
                "user_role": "admin",
                "process_id": process_id
            }
        else:
            # 普通用户逻辑 - 创建待审批的启动请求
            from app.models.tables import ProjectStartupRequest
            from pydantic import BaseModel
            
            # 获取请求原因（从请求体中获取）
            request_body = await request.json() if request.method == "POST" else {}
            request_reason = request_body.get("request_reason", "申请启动项目")
            
            # 检查是否已有待审批的请求
            from sqlalchemy import select
            stmt = select(ProjectStartupRequest).where(
                ProjectStartupRequest.project_id == project_id,
                ProjectStartupRequest.requester_id == current_user.id,
                ProjectStartupRequest.status == "pending"
            )
            result = await db.execute(stmt)
            existing_request = result.scalars().first()
            
            if existing_request:
                return {
                    "message": "您已有一个待审批的启动请求，请等待管理员审批",
                    "user_role": "user",
                    "requires_approval": True,
                    "request_id": str(existing_request.id),
                    "status": "pending"
                }
            
            # 创建新的启动请求
            startup_request = ProjectStartupRequest(
                project_id=project_id,
                requester_id=current_user.id,
                request_reason=request_reason,
                status="pending",
                is_running=False
            )
            
            db.add(startup_request)
            await db.commit()
            await db.refresh(startup_request)
            
            # 记录审计日志
            await audit_log_service.log_action(
                user_id=str(current_user.id),
                action="request_startup",
                resource_type="project",
                resource_id=str(project_id),
                changes={
                    "request_id": str(startup_request.id),
                    "request_reason": request_reason
                },
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent"),
                status="success"
            )
            
            return {
                "message": "启动请求已提交，请等待管理员审批",
                "user_role": "user",
                "requires_approval": True,
                "request_id": str(startup_request.id),
                "status": "pending"
            }
            
    except Exception as e:
        # 记录失败日志
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="start",
            resource_type="project",
            resource_id=str(project_id),
            status="failed",
            error_message=str(e),
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        raise HTTPException(status_code=500, detail=f"项目启动失败: {str(e)}")


@router.get("/{project_id}/startup-status")
async def get_project_startup_status(
    project_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_session),
) -> Any:
    """获取项目启动状态"""
    from sqlalchemy import select
    from app.models.tables import ProjectStartupRequest
    
    # 获取最新的启动记录
    stmt = select(ProjectStartupRequest).where(
        ProjectStartupRequest.project_id == project_id
    ).order_by(ProjectStartupRequest.created_at.desc())
    
    result = await db.execute(stmt)
    latest_startup = result.scalars().first()
    
    if not latest_startup:
        return {
            "is_running": False,
            "message": "项目未启动"
        }
    
    # 检查是否仍在运行（使用UTC时区进行比较）
    now = datetime.now(timezone.utc)
    is_running = (
        latest_startup.status == "approved" and
        latest_startup.started_at and
        latest_startup.started_at <= now and
        (not latest_startup.expires_at or latest_startup.expires_at > now) and
        latest_startup.is_running
    )
    
    return {
        "is_running": is_running,
        "startup_id": str(latest_startup.id),
        "status": latest_startup.status,
        "start_time": latest_startup.started_at.isoformat() if latest_startup.started_at else None,
        "end_time": latest_startup.expires_at.isoformat() if latest_startup.expires_at else None,
        "auto_shutdown": True,  # 管理员启动默认自动关闭
        "request_reason": latest_startup.request_reason
    }


@router.post("/{project_id}/stop")
async def stop_project(
    project_id: UUID,
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_session),
) -> Any:
    """
    停止项目
    - 管理员：直接停止项目进程
    - 普通用户：暂未实现
    """
    project = await crud_project.get(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    try:
        # 检查用户角色
        is_admin = current_user.role in ["admin", "superadmin"]
        
        if is_admin:
            from sqlalchemy import select, update
            from app.models.tables import ProjectStartupRequest
            
            # 获取最新的运行中的启动记录
            stmt = select(ProjectStartupRequest).where(
                ProjectStartupRequest.project_id == project_id,
                ProjectStartupRequest.is_running == True,
                ProjectStartupRequest.status == "approved"
            ).order_by(ProjectStartupRequest.created_at.desc())
            
            result = await db.execute(stmt)
            running_startup = result.scalars().first()
            
            if not running_startup:
                return {
                    "message": "项目未在运行中",
                    "user_role": "admin"
                }
            
            stopped_processes = []
            
            # 如果有进程ID，尝试停止进程
            if running_startup.process_id:
                try:
                    # 检查进程是否存在
                    if psutil.pid_exists(running_startup.process_id):
                        process = psutil.Process(running_startup.process_id)
                        
                        # 获取子进程
                        children = process.children(recursive=True)
                        
                        # 停止所有子进程
                        for child in children:
                            try:
                                child.terminate()
                                stopped_processes.append(child.pid)
                            except psutil.NoSuchProcess:
                                pass
                        
                        # 停止主进程
                        process.terminate()
                        stopped_processes.append(running_startup.process_id)
                        
                        # 等待进程结束
                        try:
                            process.wait(timeout=5)
                        except psutil.TimeoutExpired:
                            # 如果进程没有优雅关闭，强制杀死
                            process.kill()
                            for child in children:
                                try:
                                    child.kill()
                                except psutil.NoSuchProcess:
                                    pass
                        
                        stop_message = f"项目已停止，终止了 {len(stopped_processes)} 个进程"
                    else:
                        stop_message = "进程已不存在，标记为已停止"
                except psutil.NoSuchProcess:
                    stop_message = "进程已不存在，标记为已停止"
                except Exception as e:
                    stop_message = f"停止进程时出错: {str(e)}"
            else:
                stop_message = "项目已标记为停止（无进程ID）"
            
            # 更新数据库记录
            now = datetime.now(timezone.utc)
            update_stmt = update(ProjectStartupRequest).where(
                ProjectStartupRequest.id == running_startup.id
            ).values(
                is_running=False,
                status="stopped",
                updated_at=now
            )
            
            await db.execute(update_stmt)
            await db.commit()
            
            # 记录审计日志
            await audit_log_service.log_action(
                user_id=str(current_user.id),
                action="stop",
                resource_type="project",
                resource_id=str(project_id),
                changes={
                    "stopped_processes": stopped_processes,
                    "stop_time": now.isoformat()
                },
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent"),
                status="success"
            )
            
            return {
                "message": stop_message,
                "stopped_processes": stopped_processes,
                "user_role": "admin"
            }
        else:
            return {
                "message": "普通用户停止功能暂未实现",
                "user_role": "user"
            }
            
    except Exception as e:
        # 记录失败日志
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="stop",
            resource_type="project",
            resource_id=str(project_id),
            status="failed",
            error_message=str(e),
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        raise HTTPException(status_code=500, detail=f"项目停止失败: {str(e)}")


@router.get("/startup-requests/pending", response_model=list)
async def get_pending_startup_requests(
    current_user: Annotated[User, Depends(get_current_admin_user)],
    db: AsyncSession = Depends(get_session),
) -> Any:
    """
    获取待审批的项目启动请求列表（仅管理员）
    """
    from sqlalchemy import select
    from app.models.tables import ProjectStartupRequest, Project
    from app.schemas.startup_requests import StartupRequestResponse
    
    # 查询所有待审批的启动请求
    stmt = (
        select(ProjectStartupRequest, Project, User)
        .join(Project, ProjectStartupRequest.project_id == Project.id)
        .join(User, ProjectStartupRequest.requester_id == User.id)
        .where(ProjectStartupRequest.status == "pending")
        .order_by(ProjectStartupRequest.created_at.desc())
    )
    
    result = await db.execute(stmt)
    rows = result.all()
    
    # 构建响应
    requests = []
    for startup_request, project, requester in rows:
        requests.append({
            "id": str(startup_request.id),
            "project_id": str(startup_request.project_id),
            "project_name": project.name,
            "requester_id": str(startup_request.requester_id),
            "requester_name": requester.username,
            "request_reason": startup_request.request_reason,
            "status": startup_request.status,
            "created_at": startup_request.created_at.isoformat(),
            "updated_at": startup_request.updated_at.isoformat(),
        })
    
    return requests


@router.post("/startup-requests/{request_id}/approve")
async def approve_startup_request(
    request_id: UUID,
    request: Request,
    current_user: Annotated[User, Depends(get_current_admin_user)],
    db: AsyncSession = Depends(get_session),
) -> Any:
    """
    审批通过项目启动请求（仅管理员）
    """
    from sqlalchemy import select, update
    from app.models.tables import ProjectStartupRequest, Project
    
    # 获取启动请求
    stmt = select(ProjectStartupRequest).where(ProjectStartupRequest.id == request_id)
    result = await db.execute(stmt)
    startup_request = result.scalars().first()
    
    if not startup_request:
        raise HTTPException(status_code=404, detail="启动请求不存在")
    
    if startup_request.status != "pending":
        raise HTTPException(status_code=400, detail=f"该请求已被处理，当前状态：{startup_request.status}")
    
    # 获取项目信息
    project = await crud_project.get(db, startup_request.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    
    try:
        # 从配置获取启动时长（小时）
        startup_duration_hours = settings.project_startup_duration_hours
        
        # 计算启动和过期时间
        start_time = datetime.now(timezone.utc)
        end_time = start_time + timedelta(hours=startup_duration_hours)
        
        # 执行启动脚本（如果有）
        process_id = None
        startup_message = "项目启动成功"
        
        if hasattr(project, 'startup_script_path') and project.startup_script_path:
            try:
                script_path = Path(project.startup_script_path)
                
                if script_path.exists() and script_path.is_file():
                    if script_path.suffix.lower() == '.bat':
                        process = subprocess.Popen(
                            ['cmd.exe', '/c', str(script_path)],
                            cwd=script_path.parent,
                            stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE,
                            creationflags=subprocess.CREATE_NEW_CONSOLE if hasattr(subprocess, 'CREATE_NEW_CONSOLE') else 0,
                            env=dict(os.environ)
                        )
                    elif script_path.suffix.lower() == '.ps1':
                        process = subprocess.Popen(
                            ['powershell.exe', '-ExecutionPolicy', 'Bypass', '-File', str(script_path)],
                            cwd=script_path.parent,
                            stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE,
                            creationflags=subprocess.CREATE_NEW_CONSOLE if hasattr(subprocess, 'CREATE_NEW_CONSOLE') else 0,
                            env=dict(os.environ)
                        )
                    elif script_path.suffix.lower() == '.sh':
                        process = subprocess.Popen(
                            ['bash', str(script_path)],
                            cwd=script_path.parent,
                            stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE,
                            env=dict(os.environ)
                        )
                    else:
                        raise ValueError(f"不支持的脚本类型: {script_path.suffix}")
                    
                    process_id = process.pid
                    startup_message = f"项目启动成功，进程ID: {process_id}"
                    
                    # 等待进程初始化
                    import time
                    time.sleep(1)
                    
                    if psutil.pid_exists(process_id):
                        startup_message += " (进程运行正常)"
                    else:
                        startup_message += " (警告：进程可能已退出)"
            except Exception as script_error:
                startup_message = f"项目启动成功（启动脚本执行失败: {str(script_error)}）"
        
        # 更新启动请求状态
        update_stmt = update(ProjectStartupRequest).where(
            ProjectStartupRequest.id == request_id
        ).values(
            status="approved",
            approver_id=current_user.id,
            approved_at=start_time,
            started_at=start_time,
            expires_at=end_time,
            process_id=process_id,
            is_running=True,
            updated_at=start_time
        )
        
        await db.execute(update_stmt)
        await db.commit()
        
        # 记录审计日志
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="approve_startup",
            resource_type="project_startup_request",
            resource_id=str(request_id),
            changes={
                "project_id": str(project.id),
                "project_name": project.name,
                "startup_duration_hours": startup_duration_hours,
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat(),
            },
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            status="success"
        )
        
        return {
            "message": startup_message,
            "request_id": str(request_id),
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "duration_hours": startup_duration_hours,
            "process_id": process_id
        }
        
    except Exception as e:
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="approve_startup",
            resource_type="project_startup_request",
            resource_id=str(request_id),
            status="failed",
            error_message=str(e),
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        raise HTTPException(status_code=500, detail=f"审批失败: {str(e)}")


@router.post("/startup-requests/{request_id}/reject")
async def reject_startup_request(
    request_id: UUID,
    reject_reason: str,
    request: Request,
    current_user: Annotated[User, Depends(get_current_admin_user)],
    db: AsyncSession = Depends(get_session),
) -> Any:
    """
    拒绝项目启动请求（仅管理员）
    """
    from sqlalchemy import select, update
    from app.models.tables import ProjectStartupRequest
    
    # 获取启动请求
    stmt = select(ProjectStartupRequest).where(ProjectStartupRequest.id == request_id)
    result = await db.execute(stmt)
    startup_request = result.scalars().first()
    
    if not startup_request:
        raise HTTPException(status_code=404, detail="启动请求不存在")
    
    if startup_request.status != "pending":
        raise HTTPException(status_code=400, detail=f"该请求已被处理，当前状态：{startup_request.status}")
    
    try:
        now = datetime.now(timezone.utc)
        
        # 更新启动请求状态
        update_stmt = update(ProjectStartupRequest).where(
            ProjectStartupRequest.id == request_id
        ).values(
            status="rejected",
            approver_id=current_user.id,
            reject_reason=reject_reason,
            approved_at=now,
            updated_at=now
        )
        
        await db.execute(update_stmt)
        await db.commit()
        
        # 记录审计日志
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="reject_startup",
            resource_type="project_startup_request",
            resource_id=str(request_id),
            changes={
                "project_id": str(startup_request.project_id),
                "reject_reason": reject_reason,
            },
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            status="success"
        )
        
        return {
            "message": "已拒绝启动请求",
            "request_id": str(request_id),
            "reject_reason": reject_reason
        }
        
    except Exception as e:
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="reject_startup",
            resource_type="project_startup_request",
            resource_id=str(request_id),
            status="failed",
            error_message=str(e),
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        raise HTTPException(status_code=500, detail=f"拒绝失败: {str(e)}")


@router.get("/startup-requests/history", response_model=list)
async def get_startup_requests_history(
    status: str = Query(None, description="筛选状态: approved/rejected/all"),
    limit: int = Query(50, description="返回数量"),
    current_user: Annotated[User, Depends(get_current_admin_user)] = None,
    db: AsyncSession = Depends(get_session),
) -> Any:
    """
    获取历史审批记录（仅管理员）
    """
    from sqlalchemy import select, or_
    from app.models.tables import ProjectStartupRequest, Project
    
    # 构建查询条件
    conditions = []
    if status and status != "all":
        conditions.append(ProjectStartupRequest.status == status)
    else:
        # 默认显示已审批和已拒绝的记录
        conditions.append(or_(
            ProjectStartupRequest.status == "approved",
            ProjectStartupRequest.status == "rejected"
        ))
    
    # 查询历史记录
    stmt = (
        select(ProjectStartupRequest, Project, User)
        .join(Project, ProjectStartupRequest.project_id == Project.id)
        .join(User, ProjectStartupRequest.requester_id == User.id)
        .where(*conditions)
        .order_by(ProjectStartupRequest.updated_at.desc())
        .limit(limit)
    )
    
    result = await db.execute(stmt)
    rows = result.all()
    
    # 构建响应
    requests = []
    for startup_request, project, requester in rows:
        # 获取审批人信息
        approver_name = None
        if startup_request.approver_id:
            from sqlalchemy import select as sql_select
            approver_stmt = sql_select(User).where(User.id == startup_request.approver_id)
            approver_result = await db.execute(approver_stmt)
            approver = approver_result.scalars().first()
            if approver:
                approver_name = approver.username
        
        requests.append({
            "id": str(startup_request.id),
            "project_id": str(startup_request.project_id),
            "project_name": project.name,
            "requester_id": str(startup_request.requester_id),
            "requester_name": requester.username,
            "approver_id": str(startup_request.approver_id) if startup_request.approver_id else None,
            "approver_name": approver_name,
            "request_reason": startup_request.request_reason,
            "reject_reason": startup_request.reject_reason,
            "status": startup_request.status,
            "approved_at": startup_request.approved_at.isoformat() if startup_request.approved_at else None,
            "started_at": startup_request.started_at.isoformat() if startup_request.started_at else None,
            "expires_at": startup_request.expires_at.isoformat() if startup_request.expires_at else None,
            "is_running": startup_request.is_running,
            "process_id": startup_request.process_id,
            "created_at": startup_request.created_at.isoformat(),
            "updated_at": startup_request.updated_at.isoformat(),
        })
    
    return requests

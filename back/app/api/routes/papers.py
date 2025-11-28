from typing import Any, Annotated, Optional
from uuid import UUID
import os
import shutil
from pathlib import Path
from datetime import datetime
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, Query, Request, UploadFile, File
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import crud_paper
from app.db.postgres import get_session
from app.api.deps import get_current_user, get_current_admin_user
from app.models.tables import User
from app.schemas.common import PaginatedResponse, PaginationParams, StatsResponse
from app.schemas.papers import (
    AuthorContribution,
    PaperCreate,
    PaperListItem,
    PaperResponse,
    PaperUpdate,
)
from app.services.audit_log import audit_log_service

router = APIRouter(prefix="/papers", tags=["Papers"])


@router.get("/", response_model=PaginatedResponse[PaperListItem])
async def get_papers(
    pagination: PaginationParams = Depends(),
    status: str = Query(None, description="Filter by status"),
    search: str = Query(None, description="Search in title and abstract"),
    db: AsyncSession = Depends(get_session),
) -> Any:
    """获取论文列表"""
    filters = {}
    if status:
        filters["status"] = status

    if search:
        papers = await crud_paper.search(
            db, query=search, skip=pagination.offset, limit=pagination.size
        )
        total = len(papers)  # 简化实现，实际应该单独查询总数
    else:
        papers = await crud_paper.get_multi(
            db, skip=pagination.offset, limit=pagination.size, filters=filters
        )
        total = await crud_paper.count(db, filters=filters)

    items = [
        PaperListItem(
            id=paper.id,
            title=paper.title,
            authors=paper.authors,
            journal=paper.journal,
            status=paper.status,
            publish_date=paper.publish_date,
            citation_count=paper.citation_count,
            impact_factor=paper.impact_factor,
            writing_progress=paper.writing_progress,
        )
        for paper in papers
    ]

    return PaginatedResponse(
        items=items,
        total=total,
        page=pagination.page,
        size=pagination.size,
        pages=(total + pagination.size - 1) // pagination.size,
    )


@router.get("/stats", response_model=list[StatsResponse])
async def get_paper_stats(db: AsyncSession = Depends(get_session)) -> Any:
    """获取论文统计数据"""
    stats = await crud_paper.get_stats(db)
    
    def build_stat(label: str, key: str) -> StatsResponse:
        value = int(stats.get(key, 0) or 0)
        if value > 0:
            change = f"+{value}"
            trend: str = "up"
        else:
            change = "0"
            trend = "stable"
        return StatsResponse(label=label, value=value, change=change, trend=trend)

    return [
        build_stat("总论文数", "total"),
        build_stat("已发表", "published"),
        build_stat("审稿中", "reviewing"),
        build_stat("撰写中", "draft"),
    ]


@router.get("/authors/contributions", response_model=list[AuthorContribution])
async def get_author_contributions(
    limit: int = Query(10, description="Number of top authors to return"),
    db: AsyncSession = Depends(get_session),
) -> Any:
    """获取作者贡献统计"""
    return await crud_paper.get_author_contributions(db, limit=limit)


@router.get("/{paper_id}", response_model=PaperResponse)
async def get_paper(
    paper_id: UUID,
    db: AsyncSession = Depends(get_session),
) -> Any:
    """获取论文详情"""
    paper = await crud_paper.get(db, paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    return paper


@router.get("/{paper_id}/detail", response_model=PaperResponse)
async def get_paper_detail(
    paper_id: UUID,
    db: AsyncSession = Depends(get_session),
) -> Any:
    """获取论文完整详情（包含图片路径等完整信息）
    
    此接口用于详情视图，返回完整的论文信息包括图片路径和文件路径。
    与列表接口分离，避免在列表加载时传输大量图片路径信息。
    """
    paper = await crud_paper.get(db, paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    return paper


@router.get("/{paper_id}/image")
async def get_paper_image(
    paper_id: UUID,
    db: AsyncSession = Depends(get_session),
) -> Any:
    """获取论文图片
    
    根据论文的image_path字段返回图片文件。
    支持本地文件路径。
    """
    paper = await crud_paper.get(db, paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    if not paper.image_path:
        raise HTTPException(status_code=404, detail="No image attached to this paper")
    
    # 检查文件是否存在
    image_path_str = paper.image_path
    
    # 处理路径：移除前导斜杠（如果有）
    if image_path_str.startswith('/'):
        image_path_str = image_path_str[1:]
    
    image_path = Path(image_path_str)
    
    # 如果是相对路径，从 back 目录开始
    if not image_path.is_absolute():
        back_dir = Path(__file__).parent.parent.parent.parent
        image_path = back_dir / image_path
    
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
    
    # 返回图片文件
    return FileResponse(
        path=str(image_path),
        media_type=media_type,
        headers={
            "Cache-Control": "public, max-age=3600"
        }
    )


@router.get("/{paper_id}/download")
async def download_paper_file(
    paper_id: UUID,
    db: AsyncSession = Depends(get_session),
) -> Any:
    """下载论文文件
    
    根据论文的file_path字段下载对应的PDF或Word文件。
    支持本地文件路径。
    自动检测文件类型（PDF或Word）。
    """
    paper = await crud_paper.get(db, paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    if not paper.file_path:
        raise HTTPException(status_code=404, detail="No file attached to this paper")
    
    # 检查文件是否存在
    file_path_str = paper.file_path
    
    # 处理路径：移除前导斜杠（如果有）
    if file_path_str.startswith('/'):
        file_path_str = file_path_str[1:]
    
    file_path = Path(file_path_str)
    
    # 如果是相对路径，从 back 目录开始
    if not file_path.is_absolute():
        back_dir = Path(__file__).parent.parent.parent.parent
        file_path = back_dir / file_path
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
    
    if not file_path.is_file():
        raise HTTPException(status_code=400, detail="Invalid file path")
    
    # 获取文件名和扩展名
    filename = file_path.name
    extension = file_path.suffix.lower()
    
    # 设置适当的media_type
    if extension == ".pdf":
        media_type = "application/pdf"
        file_type = "pdf"
    elif extension in [".doc", ".docx"]:
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        file_type = "word"
    else:
        # 默认为二进制流
        media_type = "application/octet-stream"
        file_type = "unknown"
    
    # 返回文件
    # 对文件名进行URL编码以支持中文和特殊字符
    encoded_filename = quote(filename)
    
    return FileResponse(
        path=str(file_path),
        media_type=media_type,
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}",
            "X-File-Type": file_type
        }
    )


@router.post("/upload-file")
async def upload_paper_file(
    file: UploadFile = File(...),
    file_type: str = Query(..., description="文件类型：image 或 document"),
    current_user: Annotated[User, Depends(get_current_admin_user)] = None,
) -> Any:
    """
    上传论文文件（图片或文档）
    
    文件会被保存到 uploads/images 或 uploads/documents 文件夹
    文件名格式：原文件名_时间戳.扩展名
    
    返回服务器上的文件相对路径
    """
    try:
        # 验证文件类型
        if file_type not in ["image", "document"]:
            raise HTTPException(status_code=400, detail="文件类型必须是 image 或 document")
        
        # 获取文件扩展名
        file_extension = Path(file.filename).suffix
        
        # 验证文件扩展名
        if file_type == "image":
            allowed_extensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg"]
            upload_folder = "images"
        else:  # document
            allowed_extensions = [".pdf", ".doc", ".docx"]
            upload_folder = "documents"
        
        if file_extension.lower() not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"不支持的文件格式。允许的格式：{', '.join(allowed_extensions)}"
            )
        
        # 创建上传目录
        base_upload_dir = Path("uploads") / upload_folder
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


@router.post("/", response_model=PaperResponse)
async def create_paper(
    paper_in: PaperCreate,
    request: Request,
    current_user: Annotated[User, Depends(get_current_admin_user)],  # 需要管理员权限
    db: AsyncSession = Depends(get_session),
) -> Any:
    """创建论文（需要管理员权限）"""
    try:
        paper = await crud_paper.create(db, obj_in=paper_in)
        
        # 记录操作日志
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="create",
            resource_type="paper",
            resource_id=str(paper.id),
            changes={
                "after": {
                    "title": paper.title,
                    "status": paper.status,
                    "journal": paper.journal
                }
            },
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            status="success"
        )
        
        return paper
    except Exception as e:
        # 记录失败日志
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="create",
            resource_type="paper",
            status="failed",
            error_message=str(e),
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        raise


@router.put("/{paper_id}", response_model=PaperResponse)
async def update_paper(
    paper_id: UUID,
    paper_in: PaperUpdate,
    request: Request,
    current_user: Annotated[User, Depends(get_current_admin_user)],  # 需要管理员权限
    db: AsyncSession = Depends(get_session),
) -> Any:
    """更新论文（需要管理员权限）"""
    paper = await crud_paper.get(db, paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    try:
        # 调试日志
        print(f"\n=== 更新论文 {paper_id} ===")
        print(f"更新前 file_path: {paper.file_path}")
        print(f"请求数据: {paper_in.model_dump(exclude_unset=True)}")
        
        # 保存更新前的数据
        old_data = {
            "title": paper.title,
            "status": paper.status,
            "journal": paper.journal
        }
        
        updated_paper = await crud_paper.update(db, db_obj=paper, obj_in=paper_in)
        
        # 调试日志
        print(f"更新后 file_path: {updated_paper.file_path}")
        print(f"=== 更新完成 ===\n")
        
        # 记录更新日志
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="update",
            resource_type="paper",
            resource_id=str(paper_id),
            changes={
                "before": old_data,
                "after": {
                    "title": updated_paper.title,
                    "status": updated_paper.status,
                    "journal": updated_paper.journal
                }
            },
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            status="success"
        )
        
        return updated_paper
    except Exception as e:
        # 记录失败日志
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="update",
            resource_type="paper",
            resource_id=str(paper_id),
            status="failed",
            error_message=str(e),
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        raise


@router.delete("/{paper_id}")
async def delete_paper(
    paper_id: UUID,
    request: Request,
    current_user: Annotated[User, Depends(get_current_admin_user)],  # 需要管理员权限
    db: AsyncSession = Depends(get_session),
) -> Any:
    """删除论文（需要管理员权限）"""
    # 先获取论文信息用于日志
    paper_to_delete = await crud_paper.get(db, paper_id)
    if not paper_to_delete:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    try:
        paper = await crud_paper.remove(db, id=paper_id)
        
        # 记录删除日志
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="delete",
            resource_type="paper",
            resource_id=str(paper_id),
            changes={
                "before": {
                    "title": paper_to_delete.title,
                    "status": paper_to_delete.status,
                    "journal": paper_to_delete.journal
                }
            },
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            status="success"
        )
        
        return {"message": "Paper deleted successfully"}
    except Exception as e:
        # 记录失败日志
        await audit_log_service.log_action(
            user_id=str(current_user.id),
            action="delete",
            resource_type="paper",
            resource_id=str(paper_id),
            status="failed",
            error_message=str(e),
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        raise

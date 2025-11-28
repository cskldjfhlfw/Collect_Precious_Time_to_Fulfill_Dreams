"""论文文档API（MongoDB）"""
from typing import Any, List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.models.tables import User
from app.services.paper_document import paper_document_service

router = APIRouter(prefix="/paper-documents", tags=["Paper Documents (MongoDB)"])


class PaperDocumentCreate(BaseModel):
    """创建论文文档请求"""
    paper_id: str
    title: str
    full_text: str
    abstract: Optional[str] = None
    sections: Optional[List[dict]] = None
    figures: Optional[List[dict]] = None
    references: Optional[List[str]] = None
    metadata: Optional[dict] = None


class PaperDocumentUpdate(BaseModel):
    """更新论文文档请求"""
    title: Optional[str] = None
    full_text: Optional[str] = None
    abstract: Optional[str] = None
    sections: Optional[List[dict]] = None
    figures: Optional[List[dict]] = None
    references: Optional[List[str]] = None
    metadata: Optional[dict] = None


@router.post("/")
async def create_paper_document(
    doc_data: PaperDocumentCreate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """创建论文文档（上传论文全文）"""
    
    # 检查是否已存在
    existing = await paper_document_service.get_paper_document(doc_data.paper_id)
    if existing:
        raise HTTPException(
            status_code=400,
            detail="该论文已有全文文档，请使用更新接口"
        )
    
    # 创建文档
    doc_id = await paper_document_service.create_paper_document(
        paper_id=doc_data.paper_id,
        title=doc_data.title,
        full_text=doc_data.full_text,
        abstract=doc_data.abstract,
        sections=doc_data.sections,
        figures=doc_data.figures,
        references=doc_data.references,
        metadata=doc_data.metadata
    )
    
    return {
        "message": "论文全文上传成功",
        "document_id": doc_id,
        "paper_id": doc_data.paper_id
    }


@router.get("/{paper_id}")
async def get_paper_document(
    paper_id: str,
    current_user: User = Depends(get_current_user)
) -> Any:
    """获取论文全文文档"""
    
    doc = await paper_document_service.get_paper_document(paper_id)
    
    if not doc:
        raise HTTPException(
            status_code=404,
            detail="论文全文文档不存在"
        )
    
    return doc


@router.put("/{paper_id}")
async def update_paper_document(
    paper_id: str,
    doc_data: PaperDocumentUpdate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """更新论文全文文档"""
    
    # 检查是否存在
    existing = await paper_document_service.get_paper_document(paper_id)
    if not existing:
        raise HTTPException(
            status_code=404,
            detail="论文全文文档不存在"
        )
    
    # 更新文档
    success = await paper_document_service.update_paper_document(
        paper_id=paper_id,
        **doc_data.model_dump(exclude_none=True)
    )
    
    if success:
        return {"message": "论文全文更新成功"}
    else:
        raise HTTPException(
            status_code=500,
            detail="更新失败"
        )


@router.delete("/{paper_id}")
async def delete_paper_document(
    paper_id: str,
    current_user: User = Depends(get_current_user)
) -> Any:
    """删除论文全文文档"""
    
    success = await paper_document_service.delete_paper_document(paper_id)
    
    if success:
        return {"message": "论文全文已删除"}
    else:
        raise HTTPException(
            status_code=404,
            detail="论文全文文档不存在"
        )


@router.get("/{paper_id}/sections")
async def get_paper_sections(
    paper_id: str,
    current_user: User = Depends(get_current_user)
) -> Any:
    """获取论文章节列表"""
    
    sections = await paper_document_service.get_paper_sections(paper_id)
    
    return {
        "paper_id": paper_id,
        "sections": sections,
        "count": len(sections)
    }


@router.get("/search/full-text")
async def search_papers_full_text(
    q: str,
    limit: int = 10,
    current_user: User = Depends(get_current_user)
) -> Any:
    """全文搜索论文
    
    在论文标题、摘要、全文中搜索关键词
    """
    
    results = await paper_document_service.search_full_text(q, limit)
    
    # 只返回关键信息，不返回完整全文
    simplified_results = []
    for doc in results:
        simplified_results.append({
            "_id": doc["_id"],
            "paper_id": doc["paper_id"],
            "title": doc["title"],
            "abstract": doc.get("abstract", ""),
            "score": doc.get("score", 0),
            # 返回匹配片段（前200字符）
            "snippet": doc["full_text"][:200] + "..." if len(doc.get("full_text", "")) > 200 else doc.get("full_text", "")
        })
    
    return {
        "query": q,
        "results": simplified_results,
        "count": len(simplified_results)
    }


@router.get("/statistics/overview")
async def get_paper_statistics(
    current_user: User = Depends(get_current_user)
) -> Any:
    """获取论文文档统计信息"""
    
    stats = await paper_document_service.get_paper_statistics()
    
    return {
        "statistics": stats,
        "message": "MongoDB论文文档统计"
    }


@router.post("/admin/create-index")
async def create_text_search_index(
    current_user: User = Depends(get_current_user)
) -> Any:
    """创建全文搜索索引（管理员）"""
    
    # 检查管理员权限
    if current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(
            status_code=403,
            detail="需要管理员权限"
        )
    
    success = await paper_document_service.create_text_index()
    
    if success:
        return {"message": "全文搜索索引创建成功"}
    else:
        raise HTTPException(
            status_code=500,
            detail="索引创建失败"
        )

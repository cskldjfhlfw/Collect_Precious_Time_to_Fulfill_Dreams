from datetime import date
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from .common import BaseSchema, TimestampSchema, UUIDSchema


class PaperBase(BaseSchema):
    title: str
    authors: Optional[dict] = None
    journal: Optional[str] = None
    conference: Optional[str] = None
    publish_date: Optional[date] = None
    doi: Optional[str] = None
    impact_factor: Optional[Decimal] = None
    citation_count: int = 0
    writing_progress: int = 0
    status: str = "draft"
    abstract: Optional[str] = None
    keywords: Optional[list[str]] = None
    related_projects: Optional[dict] = None
    image_path: Optional[str] = None
    file_path: Optional[str] = None


class PaperCreate(PaperBase):
    pass


class PaperUpdate(BaseModel):
    title: Optional[str] = None
    authors: Optional[dict] = None
    journal: Optional[str] = None
    conference: Optional[str] = None
    publish_date: Optional[date] = None
    doi: Optional[str] = None
    impact_factor: Optional[Decimal] = None
    citation_count: Optional[int] = None
    writing_progress: Optional[int] = None
    status: Optional[str] = None
    abstract: Optional[str] = None
    keywords: Optional[list[str]] = None
    related_projects: Optional[dict] = None
    image_path: Optional[str] = None
    file_path: Optional[str] = None


class PaperResponse(PaperBase, UUIDSchema, TimestampSchema):
    created_by: Optional[UUID] = None


class PaperListItem(BaseSchema):
    id: UUID
    title: str
    authors: Optional[dict] = None
    journal: Optional[str] = None
    status: str
    publish_date: Optional[date] = None
    citation_count: int
    impact_factor: Optional[Decimal] = None
    writing_progress: int


class AuthorContribution(BaseSchema):
    author_name: str
    paper_count: int
    contribution_percent: int

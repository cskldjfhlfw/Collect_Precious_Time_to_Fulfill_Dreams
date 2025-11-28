from datetime import date
from typing import Optional

from pydantic import BaseModel

from app.schemas.common import BaseSchema


class SearchResult(BaseSchema):
    id: int
    title: str
    type: str
    category: str
    description: Optional[str] = None
    author: Optional[str] = None
    date: Optional[date] = None
    relevance: int
    url: str


class SearchResponse(BaseModel):
    results: list[SearchResult]
    total: int
    page: int
    size: int
    pages: int
    query: str
    search_time: float

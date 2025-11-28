from typing import Optional

from pydantic import BaseModel

from app.schemas.common import BaseSchema


class Summary(BaseSchema):
    total_papers: int
    total_projects: int
    total_patents: int
    total_resources: int
    total_software_copyrights: int = 0
    total_competitions: int = 0
    total_conferences: int = 0
    total_cooperations: int = 0


class Trend(BaseSchema):
    period: str
    papers: int
    projects: int
    patents: int
    software_copyrights: int = 0
    competitions: int = 0
    conferences: int = 0
    cooperations: int = 0


class TopAuthor(BaseSchema):
    name: str
    papers: int
    projects: int
    h_index: int


class AnalyticsOverviewResponse(BaseModel):
    summary: Summary
    trends: list[Trend]
    top_authors: list[TopAuthor]

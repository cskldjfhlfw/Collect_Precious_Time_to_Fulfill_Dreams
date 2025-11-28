from datetime import date
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from app.schemas.common import BaseSchema, TimestampSchema, UUIDSchema


class CompetitionBase(BaseSchema):
    name: str
    level: str
    award_level: Optional[str] = None
    award_date: Optional[date] = None
    registration_deadline: Optional[date] = None
    submission_deadline: Optional[date] = None
    progress_percent: int = 0
    mentor: Optional[str] = None
    team_members: Optional[dict] = None
    status: str = "planning"


class CompetitionCreate(CompetitionBase):
    pass


class CompetitionUpdate(BaseSchema):
    name: Optional[str] = None
    level: Optional[str] = None
    award_level: Optional[str] = None
    award_date: Optional[date] = None
    registration_deadline: Optional[date] = None
    submission_deadline: Optional[date] = None
    progress_percent: Optional[int] = None
    mentor: Optional[str] = None
    team_members: Optional[dict] = None
    status: Optional[str] = None


class CompetitionListItem(UUIDSchema, TimestampSchema):
    name: str
    category: Optional[str] = None
    status: str
    level: str
    team: Optional[str] = None
    members: Optional[list[str]] = None
    registration_date: Optional[date] = None
    submission_deadline: Optional[date] = None
    final_date: Optional[date] = None
    award: Optional[str] = None
    progress: int


class CompetitionResponse(UUIDSchema, TimestampSchema, CompetitionBase):
    pass

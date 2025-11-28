from datetime import date
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from app.schemas.common import BaseSchema, TimestampSchema, UUIDSchema


class ConferenceBase(BaseSchema):
    name: str
    location: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: str = "待申请"
    submission_status: Optional[str] = None
    participants: Optional[list[str]] = None
    budget: Optional[Decimal] = None
    used: Optional[Decimal] = None
    category: Optional[str] = None
    paper_title: Optional[str] = None
    description: Optional[str] = None


class ConferenceCreate(ConferenceBase):
    pass


class ConferenceUpdate(BaseSchema):
    name: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None
    submission_status: Optional[str] = None
    participants: Optional[list[str]] = None
    budget: Optional[Decimal] = None
    used: Optional[Decimal] = None
    category: Optional[str] = None
    paper_title: Optional[str] = None
    description: Optional[str] = None


class ConferenceListItem(UUIDSchema, TimestampSchema):
    name: str
    location: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: str
    submission_status: Optional[str] = None
    participants: Optional[list[str]] = None
    budget: Optional[Decimal] = None
    used: Optional[Decimal] = None
    category: Optional[str] = None
    paper_title: Optional[str] = None


class ConferenceResponse(UUIDSchema, TimestampSchema, ConferenceBase):
    pass

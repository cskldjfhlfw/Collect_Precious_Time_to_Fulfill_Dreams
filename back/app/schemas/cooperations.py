from datetime import date
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from app.schemas.common import BaseSchema, TimestampSchema, UUIDSchema


class CooperationBase(BaseSchema):
    name: str
    type: Optional[str] = None
    location: Optional[str] = None
    status: str = "洽谈中"
    projects: int = 0
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    established_date: Optional[date] = None
    last_contact: Optional[date] = None
    value: Optional[str] = None
    field: Optional[str] = None
    description: Optional[str] = None


class CooperationCreate(CooperationBase):
    pass


class CooperationUpdate(BaseSchema):
    name: Optional[str] = None
    type: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None
    projects: Optional[int] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    established_date: Optional[date] = None
    last_contact: Optional[date] = None
    value: Optional[str] = None
    field: Optional[str] = None
    description: Optional[str] = None


class CooperationListItem(UUIDSchema, TimestampSchema):
    name: str
    type: Optional[str] = None
    location: Optional[str] = None
    status: str
    projects: int
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    established_date: Optional[date] = None
    last_contact: Optional[date] = None
    value: Optional[str] = None
    field: Optional[str] = None


class CooperationResponse(UUIDSchema, TimestampSchema, CooperationBase):
    pass

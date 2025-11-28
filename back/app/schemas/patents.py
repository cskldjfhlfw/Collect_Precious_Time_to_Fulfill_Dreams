from datetime import date
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from .common import BaseSchema, TimestampSchema, UUIDSchema


class PatentBase(BaseSchema):
    name: str
    patent_number: str
    application_date: Optional[date] = None
    authorization_date: Optional[date] = None
    patent_type: str
    status: str = "draft"
    technology_field: Optional[str] = None
    commercialization_value: Optional[Decimal] = None
    maintenance_deadline: Optional[date] = None
    inventors: Optional[dict] = None
    related_projects: Optional[dict] = None
    image_path: Optional[str] = None
    file_path: Optional[str] = None


class PatentCreate(PatentBase):
    pass


class PatentUpdate(BaseModel):
    name: Optional[str] = None
    patent_number: Optional[str] = None
    application_date: Optional[date] = None
    authorization_date: Optional[date] = None
    patent_type: Optional[str] = None
    status: Optional[str] = None
    technology_field: Optional[str] = None
    commercialization_value: Optional[Decimal] = None
    maintenance_deadline: Optional[date] = None
    inventors: Optional[dict] = None
    related_projects: Optional[dict] = None
    image_path: Optional[str] = None
    file_path: Optional[str] = None


class PatentResponse(PatentBase, UUIDSchema, TimestampSchema):
    created_by: Optional[UUID] = None


class PatentListItem(BaseSchema):
    id: UUID
    name: str
    patent_number: str
    patent_type: str
    status: str
    technology_field: Optional[str] = None
    application_date: Optional[date] = None
    maintenance_deadline: Optional[date] = None

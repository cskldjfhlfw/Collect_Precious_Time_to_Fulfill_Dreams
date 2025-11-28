from datetime import date
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from app.schemas.common import BaseSchema, TimestampSchema, UUIDSchema


class SoftwareCopyrightBase(BaseSchema):
    name: str
    version: Optional[str] = None
    registration_number: str
    status: str = "待更新"
    application_date: Optional[date] = None
    approval_date: Optional[date] = None
    developer: Optional[str] = None
    category: Optional[str] = None
    language: Optional[str] = None
    description: Optional[str] = None


class SoftwareCopyrightCreate(SoftwareCopyrightBase):
    pass


class SoftwareCopyrightUpdate(BaseSchema):
    name: Optional[str] = None
    version: Optional[str] = None
    registration_number: Optional[str] = None
    status: Optional[str] = None
    application_date: Optional[date] = None
    approval_date: Optional[date] = None
    developer: Optional[str] = None
    category: Optional[str] = None
    language: Optional[str] = None
    description: Optional[str] = None


class SoftwareCopyrightListItem(UUIDSchema, TimestampSchema):
    name: str
    version: Optional[str] = None
    registration_number: str
    status: str
    application_date: Optional[date] = None
    approval_date: Optional[date] = None
    developer: Optional[str] = None
    category: Optional[str] = None
    language: Optional[str] = None


class SoftwareCopyrightResponse(UUIDSchema, TimestampSchema, SoftwareCopyrightBase):
    pass

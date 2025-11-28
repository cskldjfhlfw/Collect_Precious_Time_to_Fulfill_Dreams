from datetime import date
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from .common import BaseSchema, TimestampSchema, UUIDSchema


class ResourceBase(BaseSchema):
    name: str
    resource_type: str
    description: Optional[str] = None
    version: Optional[str] = None
    maintainer: Optional[str] = None
    maintenance_cycle_days: Optional[int] = None
    next_maintenance_date: Optional[date] = None
    license: Optional[str] = None
    download_count: int = 0
    usage_rate: Optional[Decimal] = None
    image_path: Optional[str] = None
    file_path: Optional[str] = None
    external_url: Optional[str] = None
    tags: Optional[list[str]] = None
    is_public: bool = True


class ResourceCreate(ResourceBase):
    pass


class ResourceUpdate(BaseModel):
    name: Optional[str] = None
    resource_type: Optional[str] = None
    description: Optional[str] = None
    version: Optional[str] = None
    maintainer: Optional[str] = None
    maintenance_cycle_days: Optional[int] = None
    next_maintenance_date: Optional[date] = None
    license: Optional[str] = None
    download_count: Optional[int] = None
    usage_rate: Optional[Decimal] = None
    image_path: Optional[str] = None
    file_path: Optional[str] = None
    external_url: Optional[str] = None
    tags: Optional[list[str]] = None
    is_public: Optional[bool] = None


class ResourceResponse(ResourceBase, UUIDSchema, TimestampSchema):
    created_by: Optional[UUID] = None


class ResourceListItem(BaseSchema):
    id: UUID
    name: str
    resource_type: str
    version: Optional[str] = None
    maintainer: Optional[str] = None
    download_count: int
    usage_rate: Optional[Decimal] = None
    next_maintenance_date: Optional[date] = None
    is_public: bool


class ResourceUsageLogBase(BaseSchema):
    usage_type: str
    quantity: int = 1
    duration_hours: Optional[int] = None
    notes: Optional[str] = None


class ResourceUsageLogCreate(ResourceUsageLogBase):
    resource_id: UUID


class ResourceUsageLogResponse(ResourceUsageLogBase, UUIDSchema, TimestampSchema):
    resource_id: UUID
    user_id: Optional[UUID] = None

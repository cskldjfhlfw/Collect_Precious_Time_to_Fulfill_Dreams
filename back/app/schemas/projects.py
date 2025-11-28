from datetime import date
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from .common import BaseSchema, TimestampSchema, UUIDSchema


class ProjectBase(BaseSchema):
    name: str
    project_number: str
    project_type: str
    principal: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: Optional[Decimal] = None
    budget_used: Optional[Decimal] = None
    status: str = "planning"
    progress_percent: int = 0
    priority: Optional[str] = None
    risk_level: Optional[str] = None
    description: Optional[str] = None
    image_path: Optional[str] = None
    startup_script_path: Optional[str] = None
    startup_command: Optional[str] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    project_number: Optional[str] = None
    project_type: Optional[str] = None
    principal: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: Optional[Decimal] = None
    budget_used: Optional[Decimal] = None
    status: Optional[str] = None
    progress_percent: Optional[int] = None
    priority: Optional[str] = None
    risk_level: Optional[str] = None
    description: Optional[str] = None
    image_path: Optional[str] = None
    startup_script_path: Optional[str] = None
    startup_command: Optional[str] = None


class ProjectResponse(ProjectBase, UUIDSchema, TimestampSchema):
    created_by: Optional[UUID] = None


class ProjectListItem(BaseSchema):
    id: UUID
    name: str
    project_number: str
    project_type: str
    status: str
    progress_percent: int
    budget: Optional[Decimal] = None
    budget_used: Optional[Decimal] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    priority: Optional[str] = None


class ProjectMilestoneBase(BaseSchema):
    name: str
    description: Optional[str] = None
    due_date: Optional[date] = None
    status: str = "pending"
    completion_percent: int = 0
    responsible_person: Optional[str] = None


class ProjectMilestoneCreate(ProjectMilestoneBase):
    project_id: UUID


class ProjectMilestoneResponse(ProjectMilestoneBase, UUIDSchema, TimestampSchema):
    project_id: UUID

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class StartupRequestBase(BaseModel):
    request_reason: Optional[str] = None


class StartupRequestCreate(StartupRequestBase):
    project_id: UUID


class StartupRequestUpdate(BaseModel):
    status: Optional[str] = None
    reject_reason: Optional[str] = None
    approver_id: Optional[UUID] = None


class StartupRequestResponse(StartupRequestBase):
    id: UUID
    project_id: UUID
    requester_id: UUID
    approver_id: Optional[UUID]
    status: str
    reject_reason: Optional[str]
    approved_at: Optional[datetime]
    started_at: Optional[datetime]
    expires_at: Optional[datetime]
    process_id: Optional[int]
    is_running: bool
    created_at: datetime
    updated_at: datetime
    
    # 关联信息
    project_name: Optional[str] = None
    requester_name: Optional[str] = None
    approver_name: Optional[str] = None

    class Config:
        from_attributes = True

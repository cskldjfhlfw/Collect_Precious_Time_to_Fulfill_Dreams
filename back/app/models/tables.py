from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "users"

    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="user", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    region: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)


class Paper(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "papers"

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    authors: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    journal: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    conference: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    publish_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    doi: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    impact_factor: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2), nullable=True)
    citation_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    writing_progress: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="draft", nullable=False)
    abstract: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    keywords: Mapped[Optional[list[str]]] = mapped_column(ARRAY(String()), nullable=True)
    related_projects: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    image_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    file_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_by: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=True)


class Patent(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "patents"

    name: Mapped[str] = mapped_column(String(500), nullable=False)
    patent_number: Mapped[str] = mapped_column(String(100), nullable=False)
    application_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    authorization_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    patent_type: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="draft", nullable=False)
    technology_field: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    commercialization_value: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    maintenance_deadline: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    inventors: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    related_projects: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    image_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    file_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_by: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=True)


class SoftwareCopyright(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "software_copyrights"

    name: Mapped[str] = mapped_column(String(500), nullable=False)
    registration_number: Mapped[str] = mapped_column(String(100), nullable=False)
    registration_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    version: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    development_language: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    latest_update: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    maintenance_contact: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    developers: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    image_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    file_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_by: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=True)


class Project(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "projects"

    name: Mapped[str] = mapped_column(String(500), nullable=False)
    project_number: Mapped[str] = mapped_column(String(100), nullable=False)
    project_type: Mapped[str] = mapped_column(String(20), nullable=False)
    principal: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    budget: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    budget_used: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="planning", nullable=False)
    progress_percent: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    priority: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    risk_level: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    image_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    startup_script_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True, comment="启动脚本路径（相对于projects目录）")
    startup_command: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="启动命令")
    created_by: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=True)


class Competition(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "competitions"

    name: Mapped[str] = mapped_column(String(500), nullable=False)
    level: Mapped[str] = mapped_column(String(20), nullable=False)
    award_level: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    award_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    registration_deadline: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    submission_deadline: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    progress_percent: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    mentor: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    team_members: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="planning", nullable=False)
    image_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    file_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_by: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=True)


class Conference(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "conferences"

    name: Mapped[str] = mapped_column(String(500), nullable=False)
    level: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    participation_type: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    submission_status: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    travel_budget: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    travel_expense: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    visa_required: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    reminder_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    participants: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    image_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    file_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_by: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=True)


class Cooperation(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "cooperations"

    organization: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    cooperation_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="negotiating", nullable=False)
    cooperation_value: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    pipeline_stage: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    contact_person: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    contact_email: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    contact_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    next_follow_up: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    image_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    file_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_by: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=True)


class Resource(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "resources"

    name: Mapped[str] = mapped_column(String(500), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    version: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    maintainer: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    maintenance_cycle_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    next_maintenance_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    license: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    download_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    usage_rate: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2), nullable=True)
    image_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    file_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    external_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    tags: Mapped[Optional[list[str]]] = mapped_column(ARRAY(String()), nullable=True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_by: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=True)


class Relationship(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "relationships"

    source_type: Mapped[str] = mapped_column(String(50), nullable=False)
    source_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), nullable=False)
    target_type: Mapped[str] = mapped_column(String(50), nullable=False)
    target_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), nullable=False)
    relationship_type: Mapped[str] = mapped_column(String(50), nullable=False)


class ResourceAchievement(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "resource_achievements"
    __table_args__ = (
        UniqueConstraint("resource_id", "achievement_type", "achievement_id", name="uq_resource_achievements"),
    )

    resource_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("resources.id"), nullable=False)
    achievement_type: Mapped[str] = mapped_column(String(50), nullable=False)
    achievement_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), nullable=False)
    relationship_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)


class Tag(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "tags"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    color: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)


class AchievementTag(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "achievement_tags"
    __table_args__ = (
        UniqueConstraint("achievement_type", "achievement_id", "tag_id", name="uq_achievement_tags"),
    )

    achievement_type: Mapped[str] = mapped_column(String(50), nullable=False)
    achievement_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), nullable=False)
    tag_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("tags.id"), nullable=False)


class PaperAuthor(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "paper_authors"

    paper_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("papers.id"), nullable=False)
    author_id: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    author_name: Mapped[str] = mapped_column(String(100), nullable=False)
    affiliation: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    contribution_level: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


class ProjectMilestone(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "project_milestones"

    project_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    completion_percent: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    responsible_person: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)


class Reminder(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "reminders"

    related_type: Mapped[str] = mapped_column(String(50), nullable=False)
    related_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reminder_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    priority: Mapped[str] = mapped_column(String(20), default="normal", nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    created_by: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=True)


class ResourceUsageLog(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "resource_usage_logs"

    resource_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("resources.id"), nullable=False)
    user_id: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    usage_type: Mapped[str] = mapped_column(String(50), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    duration_hours: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    usage_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class ResourceMaintenanceTask(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "resource_maintenance_tasks"

    resource_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("resources.id"), nullable=False)
    task_name: Mapped[str] = mapped_column(String(200), nullable=False)
    scheduled_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    assignee: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)


class SearchSavedView(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "search_saved_views"
    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_search_saved_views_user_name"),
    )

    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    filters: Mapped[dict] = mapped_column(JSONB, nullable=False)


class ProjectStartupRequest(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """项目启动请求表"""
    __tablename__ = "project_startup_requests"

    project_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    requester_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False, comment="请求人")
    approver_id: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=True, comment="审批人")
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False, comment="pending/approved/rejected/expired")
    request_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="请求原因")
    reject_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="拒绝原因")
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, comment="审批时间")
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, comment="启动时间")
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, comment="过期时间（1小时后）")
    process_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, comment="进程 ID")
    is_running: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, comment="是否运行中")

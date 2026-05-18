from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.base import Base

# The RefreshToken model is declared after User; ensure forward refs are satisfied by importing here


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255))
    auth_provider: Mapped[str] = mapped_column(String(50), default="clerk", nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="candidate", nullable=False)

    resumes: Mapped[list[Resume]] = relationship(back_populates="user", cascade="all, delete-orphan")  # type: ignore[name-defined]
    job_descriptions: Mapped[list[JobDescription]] = relationship(back_populates="user", cascade="all, delete-orphan")  # type: ignore[name-defined]
    refresh_tokens: Mapped[list[RefreshToken]] = relationship(back_populates="user", cascade="all, delete-orphan")  # type: ignore[name-defined]


class Resume(Base, TimestampMixin):
    __tablename__ = "resumes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), index=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    original_filename: Mapped[str | None] = mapped_column(String(255))
    file_type: Mapped[str] = mapped_column(String(50), nullable=False)
    storage_key: Mapped[str | None] = mapped_column(String(500))
    status: Mapped[str] = mapped_column(String(50), default="uploaded", nullable=False)
    ats_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    semantic_match: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    parsed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    user: Mapped[User | None] = relationship(back_populates="resumes")
    versions: Mapped[list[ResumeVersion]] = relationship(back_populates="resume", cascade="all, delete-orphan")  # type: ignore[name-defined]
    feedback_entries: Mapped[list[AIFeedback]] = relationship(back_populates="resume", cascade="all, delete-orphan")  # type: ignore[name-defined]
    interview_questions: Mapped[list[InterviewQuestion]] = relationship(back_populates="resume", cascade="all, delete-orphan")  # type: ignore[name-defined]
    analytics: Mapped[list[AnalyticsEvent]] = relationship(back_populates="resume", cascade="all, delete-orphan")  # type: ignore[name-defined]


class JobDescription(Base, TimestampMixin):
    __tablename__ = "job_descriptions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    company: Mapped[str | None] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, nullable=False)
    normalized_text: Mapped[str | None] = mapped_column(Text)

    user: Mapped[User | None] = relationship(back_populates="job_descriptions")


class ResumeVersion(Base, TimestampMixin):
    __tablename__ = "resume_versions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    resume_id: Mapped[str] = mapped_column(ForeignKey("resumes.id", ondelete="CASCADE"), index=True)
    version_label: Mapped[str] = mapped_column(String(100), nullable=False)
    summary: Mapped[str | None] = mapped_column(Text)
    ats_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    semantic_match: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    source_notes: Mapped[str | None] = mapped_column(Text)

    resume: Mapped[Resume] = relationship(back_populates="versions")


class AIFeedback(Base, TimestampMixin):
    __tablename__ = "ai_feedback"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    resume_id: Mapped[str] = mapped_column(ForeignKey("resumes.id", ondelete="CASCADE"), index=True)
    mode: Mapped[str] = mapped_column(String(50), default="analysis", nullable=False)
    prompt: Mapped[str | None] = mapped_column(Text)
    response_text: Mapped[str] = mapped_column(Text, nullable=False)
    model_name: Mapped[str | None] = mapped_column(String(100))

    resume: Mapped[Resume] = relationship(back_populates="feedback_entries")


class InterviewQuestion(Base, TimestampMixin):
    __tablename__ = "interview_questions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    resume_id: Mapped[str] = mapped_column(ForeignKey("resumes.id", ondelete="CASCADE"), index=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    tone: Mapped[str | None] = mapped_column(String(100))
    bookmarked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    resume: Mapped[Resume] = relationship(back_populates="interview_questions")


class AnalyticsEvent(Base, TimestampMixin):
    __tablename__ = "analytics"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    resume_id: Mapped[str | None] = mapped_column(ForeignKey("resumes.id", ondelete="CASCADE"), index=True)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    payload: Mapped[dict[str, Any] | None] = mapped_column(JSON)

    resume: Mapped[Resume | None] = relationship(back_populates="analytics")


class ReindexJob(Base, TimestampMixin):
    __tablename__ = "reindex_jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    status: Mapped[str] = mapped_column(String(50), default="queued", nullable=False)
    total: Mapped[int | None] = mapped_column(Integer, nullable=True)
    processed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text)
    job_metadata: Mapped[dict | None] = mapped_column(JSON)


class SearchQuery(Base, TimestampMixin):
    __tablename__ = "search_queries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    query_text: Mapped[str] = mapped_column(Text, nullable=False)
    user_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    result_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


class RefreshTokenAudit(Base, TimestampMixin):
    __tablename__ = "refresh_token_audit"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    actor_user_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    token_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    details: Mapped[str | None] = mapped_column(Text)


class RefreshToken(Base, TimestampMixin):
    __tablename__ = "refresh_tokens"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped[User | None] = relationship(back_populates="refresh_tokens")


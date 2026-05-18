from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

from app.core.config import settings
from app.models.entities import Resume, ResumeVersion, AIFeedback, AnalyticsEvent


def _sync_url() -> str:
    url = settings.database_url
    # convert async drivers to sync equivalents
    if url.startswith("postgresql+asyncpg://"):
        return url.replace("postgresql+asyncpg://", "postgresql://", 1)
    if "+asyncpg" in url:
        return url.replace("+asyncpg", "")
    if url.startswith("sqlite+aiosqlite://"):
        return url.replace("sqlite+aiosqlite://", "sqlite://", 1)
    if "+aiosqlite" in url:
        return url.replace("+aiosqlite", "")
    return url


_ENGINE = create_engine(_sync_url(), echo=False, future=True)
SyncSession = sessionmaker(bind=_ENGINE)


def get_resume_by_filename(filename: str):
    with SyncSession() as session:
        return session.query(Resume).filter(Resume.filename == filename).first()


def create_resume(filename: str, original_filename: str | None, file_type: str, storage_key: str | None = None, user_id: str | None = None):
    with SyncSession() as session:
        resume = Resume(
            filename=filename,
            original_filename=original_filename,
            file_type=file_type,
            storage_key=storage_key,
            user_id=user_id,
        )
        session.add(resume)
        session.commit()
        session.refresh(resume)
        return resume


def create_version(resume_id: str, version_label: str, summary: str | None, ats_score: int = 0, semantic_match: float = 0.0, source_notes: str | None = None):
    with SyncSession() as session:
        v = ResumeVersion(
            resume_id=resume_id,
            version_label=version_label,
            summary=summary,
            ats_score=ats_score,
            semantic_match=semantic_match,
            source_notes=source_notes,
        )
        session.add(v)
        session.commit()
        session.refresh(v)
        return v


def add_feedback(resume_id: str, response_text: str, prompt: str | None = None, model_name: str | None = None, mode: str = "analysis"):
    with SyncSession() as session:
        fb = AIFeedback(
            resume_id=resume_id,
            mode=mode,
            prompt=prompt,
            response_text=response_text,
            model_name=model_name,
        )
        session.add(fb)
        session.commit()
        session.refresh(fb)
        return fb


def add_analytics_event(resume_id: str | None, event_type: str, payload: dict | None = None):
    with SyncSession() as session:
        ev = AnalyticsEvent(resume_id=resume_id, event_type=event_type, payload=payload)
        session.add(ev)
        session.commit()
        session.refresh(ev)
        return ev


def create_reindex_job(total: int | None = None, metadata: dict | None = None):
    from app.models.entities import ReindexJob

    with SyncSession() as session:
        job = ReindexJob(total=total, processed=0, status="queued", metadata=metadata)
        session.add(job)
        session.commit()
        session.refresh(job)
        return job


def update_reindex_job(job_id: str, *, processed: int | None = None, status: str | None = None, error_message: str | None = None):
    from app.models.entities import ReindexJob

    with SyncSession() as session:
        job = session.get(ReindexJob, job_id)
        if not job:
            return None
        if processed is not None:
            job.processed = processed
        if status is not None:
            job.status = status
        if error_message is not None:
            job.error_message = error_message
        session.add(job)
        session.commit()
        session.refresh(job)
        return job


def get_reindex_job(job_id: str):
    from app.models.entities import ReindexJob

    with SyncSession() as session:
        return session.get(ReindexJob, job_id)

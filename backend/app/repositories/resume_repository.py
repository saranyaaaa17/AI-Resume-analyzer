from __future__ import annotations

from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.entities import AIFeedback, Resume, ResumeVersion
from .base import Repository


class ResumeRepository(Repository):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get_by_filename(self, filename: str) -> Resume | None:
        result = await self.session.execute(select(Resume).where(Resume.filename == filename).limit(1))
        return result.scalar_one_or_none()

    async def create_resume(self, filename: str, original_filename: str | None, file_type: str, storage_key: str | None = None, user_id: str | None = None) -> Resume:
        resume = Resume(
            filename=filename,
            original_filename=original_filename,
            file_type=file_type,
            storage_key=storage_key,
            user_id=user_id,
        )
        self.session.add(resume)
        await self.session.commit()
        await self.session.refresh(resume)
        return resume

    async def create_version(self, resume_id: str, version_label: str, summary: str | None, ats_score: int = 0, semantic_match: float = 0.0, source_notes: str | None = None) -> ResumeVersion:
        version = ResumeVersion(
            resume_id=resume_id,
            version_label=version_label,
            summary=summary,
            ats_score=ats_score,
            semantic_match=semantic_match,
            source_notes=source_notes,
        )
        self.session.add(version)
        await self.session.commit()
        await self.session.refresh(version)
        return version

    async def add_feedback(self, resume_id: str, response_text: str, prompt: str | None = None, model_name: str | None = None, mode: str = "analysis") -> AIFeedback:
        fb = AIFeedback(
            resume_id=resume_id,
            mode=mode,
            prompt=prompt,
            response_text=response_text,
            model_name=model_name,
        )
        self.session.add(fb)
        await self.session.commit()
        await self.session.refresh(fb)
        return fb

    async def list_recent_resumes(self, limit: int = 10) -> list[Resume]:
        result = await self.session.execute(select(Resume).order_by(desc(Resume.created_at)).limit(limit))
        return list(result.scalars().all())

    async def get_latest_version(self, resume_id: str) -> ResumeVersion | None:
        result = await self.session.execute(
            select(ResumeVersion)
            .where(ResumeVersion.resume_id == resume_id)
            .order_by(desc(ResumeVersion.created_at))
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def list_feedback(self, resume_id: str) -> list[AIFeedback]:
        result = await self.session.execute(
            select(AIFeedback).where(AIFeedback.resume_id == resume_id).order_by(desc(AIFeedback.created_at))
        )
        return list(result.scalars().all())
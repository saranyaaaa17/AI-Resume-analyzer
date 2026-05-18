from __future__ import annotations

from .celery_app import celery_app
from app.services.parse import extract_text_from_bytes
from app.services.openai_service import request_feedback_from_openai
from app.services.intelligence import build_resume_intelligence
from app.services.embeddings import upsert_resume_vector
from app.db.session import AsyncSessionLocal
from app.repositories.resume_repository import ResumeRepository
import asyncio


@celery_app.task(name="resume.analyze")
def analyze_resume_task(filename: str, file_bytes: bytes, content_type: str | None = None, user_id: str | None = None) -> dict:
    """Background task to analyze a resume: parse, request feedback, persist, and index embeddings.

    This runs inside a Celery worker (sync context). It will create a DB session synchronously via AsyncSessionLocal.
    """
    try:
        text = extract_text_from_bytes(file_bytes)
        feedback = request_feedback_from_openai(text)
        intelligence = build_resume_intelligence(filename, text, feedback)

        # persist records (use AsyncSessionLocal to create an async session from sync code)
        # persist records using a synchronous repo (avoid running async DB calls in worker)
        try:
            from .sync_repo import get_resume_by_filename, create_resume, create_version, add_feedback as sync_add_feedback

            resume = get_resume_by_filename(filename)
            if resume is None:
                resume = create_resume(filename=filename, original_filename=filename, file_type=content_type or "application/pdf", storage_key=None, user_id=user_id)
            create_version(resume_id=resume.id, version_label="background-analysis", summary=intelligence.feedback[:1000], ats_score=intelligence.ats_score, semantic_match=intelligence.semantic_match)
            sync_add_feedback(resume_id=resume.id, response_text=intelligence.feedback, prompt=None, model_name=None)
        except Exception:
            # fallback to async persistence
            async def _persist_async():
                async with AsyncSessionLocal() as session:
                    repo = ResumeRepository(session)
                    resume = await repo.get_by_filename(filename)
                    if resume is None:
                        resume = await repo.create_resume(filename=filename, original_filename=filename, file_type=content_type or "application/pdf", storage_key=None, user_id=user_id)
                    await repo.create_version(resume_id=resume.id, version_label="background-analysis", summary=intelligence.feedback[:1000], ats_score=intelligence.ats_score, semantic_match=intelligence.semantic_match)
                    await repo.add_feedback(resume_id=resume.id, response_text=intelligence.feedback, prompt=None, model_name=None)

            try:
                asyncio.run(_persist_async())
            except RuntimeError:
                loop = asyncio.get_event_loop()
                loop.run_until_complete(_persist_async())

        # upsert embeddings (best-effort)
        try:
            upsert_resume_vector(resume_id=filename, text=text, metadata={"filename": filename, "user_id": user_id})
        except Exception:
            pass

        # return the intelligence payload so clients can display results without extra roundtrips
        return {
            "status": "ok",
            "filename": filename,
            "extracted_text": intelligence.extracted_text,
            "feedback": intelligence.feedback,
            "ats_score": intelligence.ats_score,
            "semantic_match": intelligence.semantic_match,
            "missing_skills": intelligence.missing_skills,
            "strengths": intelligence.strengths,
        }
    except Exception as ex:
        return {"status": "error", "error": str(ex)}


@celery_app.task(name="resume.reindex")
def batch_reindex_task(job_id: str | None = None, limit: int | None = None) -> dict:
    """Batch reindex resumes into Chroma and update ReindexJob progress."""
    try:
        # create or attach to a ReindexJob
        from .sync_repo import create_reindex_job, update_reindex_job, get_reindex_job
        from app.repositories.resume_repository import ResumeRepository

        # if no job_id provided, create one
        job = None
        if job_id:
            job = get_reindex_job(job_id)
        if not job:
            job = create_reindex_job(total=None)

        # iterate resumes in pages
        from sqlalchemy import select
        from app.db.session import AsyncSessionLocal as ASyncLocal

        processed = job.processed or 0
        page = 0
        page_size = limit or 100

        # use async session to list resumes in batches
        import asyncio as _asyncio

        async def _run_batches():
            nonlocal processed, page
            async with ASyncLocal() as session:
                repo = ResumeRepository(session)
                while True:
                    resumes = await repo.list_recent_resumes(limit=page_size)
                    if not resumes:
                        break
                    for r in resumes:
                        try:
                            upsert_resume_vector(r.id, r.versions[0].source_notes if r.versions and r.versions[0].source_notes else r.filename, metadata={"filename": r.filename, "resume_id": r.id})
                        except Exception:
                            pass
                        processed += 1
                        update_reindex_job(job.id, processed=processed, status="running")
                    page += 1
                    if len(resumes) < page_size:
                        break

        try:
            _asyncio.run(_run_batches())
        except RuntimeError:
            loop = _asyncio.get_event_loop()
            loop.run_until_complete(_run_batches())

        update_reindex_job(job.id, processed=processed, status="completed")
        return {"status": "ok", "job_id": job.id, "processed": processed}
    except Exception as ex:
        try:
            update_reindex_job(job.id, status="error", error_message=str(ex))
        except Exception:
            pass
        return {"status": "error", "error": str(ex)}

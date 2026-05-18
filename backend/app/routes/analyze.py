
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import os
import asyncio
from dataclasses import asdict
from datetime import datetime

from ..services.parse import extract_text_from_bytes
from ..services.openai_service import request_feedback_from_openai
from ..services.intelligence import build_resume_intelligence
from ..models.schemas import ResumeIntelligenceResponse
from ..db.session import get_db_session
from ..repositories.resume_repository import ResumeRepository

router = APIRouter()

@router.post("/analyze")
async def analyze_resume(file: UploadFile = File(...), db: AsyncSession = Depends(get_db_session)) -> dict[str, str]:
    # Basic validation
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file uploaded")

    if file.content_type != "application/pdf" and not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only PDF files are allowed")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty")

    # Extract text
    text = extract_text_from_bytes(contents)
    if not text:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Could not extract text from PDF")

    # Call OpenAI (run in thread to avoid blocking)
    feedback = await asyncio.to_thread(request_feedback_from_openai, text)

    intelligence = build_resume_intelligence(os.path.basename(file.filename), text, feedback)

    # persist resume, version and feedback
    repo = ResumeRepository(db)
    filename = os.path.basename(file.filename)
    resume = await repo.get_by_filename(filename)
    if resume is None:
        resume = await repo.create_resume(filename=filename, original_filename=file.filename, file_type=file.content_type or "application/pdf", storage_key=None)

    version_label = f"analysis-{datetime.utcnow().isoformat()}"
    await repo.create_version(resume_id=resume.id, version_label=version_label, summary=(feedback[:1000] if feedback else None), ats_score=intelligence.ats_score, semantic_match=intelligence.semantic_match, source_notes=None)
    await repo.add_feedback(resume_id=resume.id, response_text=feedback, prompt=None, model_name=None)

    return {"filename": filename, "extracted_text": text, "feedback": feedback}


@router.post("/analysis/full", response_model=ResumeIntelligenceResponse)
async def analyze_resume_full(file: UploadFile = File(...), db: AsyncSession = Depends(get_db_session)) -> ResumeIntelligenceResponse:
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file uploaded")

    if file.content_type not in {"application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"} and not file.filename.lower().endswith((".pdf", ".docx")):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only PDF or DOCX files are allowed")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty")

    text = extract_text_from_bytes(contents)
    if not text:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Could not extract text from document")

    feedback = await asyncio.to_thread(request_feedback_from_openai, text)
    intelligence = build_resume_intelligence(os.path.basename(file.filename), text, feedback)

    # persist to DB
    repo = ResumeRepository(db)
    filename = os.path.basename(file.filename)
    resume = await repo.get_by_filename(filename)
    if resume is None:
        resume = await repo.create_resume(filename=filename, original_filename=file.filename, file_type=file.content_type or "application/pdf", storage_key=None)

    version_label = f"analysis-{datetime.utcnow().isoformat()}"
    await repo.create_version(resume_id=resume.id, version_label=version_label, summary=(intelligence.feedback[:1000] if intelligence.feedback else None), ats_score=intelligence.ats_score, semantic_match=intelligence.semantic_match, source_notes=None)
    await repo.add_feedback(resume_id=resume.id, response_text=intelligence.feedback, prompt=None, model_name=None)

    return ResumeIntelligenceResponse(**asdict(intelligence))

from fastapi import APIRouter, UploadFile, File, HTTPException, status
from typing import Dict
import os
import asyncio

from ..services.parse import extract_text_from_bytes
from ..services.openai_service import request_feedback_from_openai
from ..models.schemas import UploadResponse

router = APIRouter()

@router.post("/analyze")
async def analyze_resume(file: UploadFile = File(...)) -> Dict[str, str]:
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

    return {"filename": os.path.basename(file.filename), "extracted_text": text[:300], "feedback": feedback}

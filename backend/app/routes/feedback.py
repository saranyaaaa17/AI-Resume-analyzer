from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
import asyncio

from ..services.openai_service import request_feedback_from_openai

router = APIRouter()

class FeedbackRequest(BaseModel):
    text: str

class FeedbackResponse(BaseModel):
    feedback: str


@router.post("/feedback", response_model=FeedbackResponse)
async def feedback(req: FeedbackRequest):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Text is required for feedback")

    # run in thread so sync OpenAI SDK does not block event loop
    feedback_text = await asyncio.to_thread(request_feedback_from_openai, req.text)
    return {"feedback": feedback_text}

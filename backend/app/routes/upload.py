from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends
import aiofiles
import os
from sqlalchemy.ext.asyncio import AsyncSession
from ..models.schemas import UploadResponse
from ..db.session import get_db_session
from ..repositories.resume_repository import ResumeRepository

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
UPLOAD_DIR = os.path.abspath(UPLOAD_DIR)
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload", response_model=UploadResponse)
async def upload_resume(file: UploadFile = File(...), db: AsyncSession = Depends(get_db_session)) -> dict[str, str]:
    # Basic validation
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file uploaded")

    # Validate content type and extension
    if file.content_type != "application/pdf" and not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only PDF files are allowed")

    # Read a small chunk to ensure the file isn't empty
    contents = await file.read()
    if not contents or len(contents) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty")

    # Save file asynchronously
    safe_name = os.path.basename(file.filename)
    target_path = os.path.join(UPLOAD_DIR, safe_name)
    async with aiofiles.open(target_path, "wb") as out_file:
        await out_file.write(contents)

    # persist a Resume record
    repo = ResumeRepository(db)
    await repo.create_resume(filename=safe_name, original_filename=file.filename, file_type=file.content_type or "application/pdf", storage_key=target_path)

    return {"filename": safe_name}

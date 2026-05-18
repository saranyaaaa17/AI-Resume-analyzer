from fastapi import APIRouter, UploadFile, File, HTTPException, status
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from worker.tasks import analyze_resume_task
from ..db.session import get_db_session
from ..services.auth import get_current_user, optional_current_user

router = APIRouter()


@router.post('/tasks/analyze')
async def enqueue_analyze(file: UploadFile = File(...), db: AsyncSession = Depends(get_db_session), _user=Depends(optional_current_user)):
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='No file uploaded')

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Uploaded file is empty')

    # enqueue Celery task; return task id for client to poll
    result = analyze_resume_task.delay(file.filename, contents, file.content_type or None)
    return {"task_id": result.id}


@router.get('/tasks/{task_id}')
async def task_status(task_id: str, _user=Depends(optional_current_user)):
    from worker.celery_app import celery_app

    res = celery_app.AsyncResult(task_id)
    payload = {"task_id": task_id, "status": res.status}
    if res.ready():
        try:
            payload["result"] = res.result
        except Exception:
            payload["result"] = None
    return payload

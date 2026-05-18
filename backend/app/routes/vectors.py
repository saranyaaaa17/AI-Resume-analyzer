from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from ..services.embeddings import query_similar, upsert_resume_vector
from ..db.session import get_db_session
from ..repositories.resume_repository import ResumeRepository
from ..services.auth import get_current_user, optional_current_user
from sqlalchemy import select
from ..models.entities import SearchQuery

router = APIRouter()


class QueryRequest(BaseModel):
    text: str
    n: int = 5


@router.post('/vectors/query')
async def vectors_query(req: QueryRequest, db: AsyncSession = Depends(get_db_session), _user=Depends(optional_current_user)):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Text is required')

    results = query_similar(req.text, n=req.n)

    # persist search query
    try:
        query_obj = SearchQuery(query_text=req.text, result_count=len(results))
        db.add(query_obj)
        await db.commit()
        await db.refresh(query_obj)
    except Exception:
        pass

    return {'results': results}


from worker.tasks import batch_reindex_task


class ReindexResponse(BaseModel):
    job_id: str


@router.post('/vectors/reindex', response_model=ReindexResponse)
async def vectors_reindex(db: AsyncSession = Depends(get_db_session), _user=Depends(optional_current_user)):
    # require admin role
    if not _user or getattr(_user, 'role', None) != 'admin':
        raise HTTPException(status_code=403, detail='Admin role required to reindex')

    # enqueue batch reindex job
    result = batch_reindex_task.delay()
    return {"job_id": result.id}


@router.get('/vectors/reindex/{job_id}')
async def reindex_status(job_id: str, _user=Depends(optional_current_user)):
    from worker.sync_repo import get_reindex_job

    if not _user or getattr(_user, 'role', None) != 'admin':
        raise HTTPException(status_code=403, detail='Admin role required to get job status')

    job = get_reindex_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail='Job not found')
    return {
        'job_id': job.id,
        'status': job.status,
        'total': job.total,
        'processed': job.processed,
        'error_message': job.error_message,
        'created_at': job.created_at.isoformat() if job.created_at else None,
        'updated_at': job.updated_at.isoformat() if job.updated_at else None,
    }


@router.get('/vectors/history')
async def vectors_history(limit: int = 20, db: AsyncSession = Depends(get_db_session), _user=Depends(optional_current_user)):
    result = await db.execute(select(SearchQuery).order_by(SearchQuery.created_at.desc()).limit(limit))
    rows = result.scalars().all()
    out = [
        {"id": r.id, "query_text": r.query_text, "result_count": r.result_count, "created_at": r.created_at.isoformat() if r.created_at else None}
        for r in rows
    ]
    return {"history": out}

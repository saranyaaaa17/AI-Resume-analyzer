from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from .routes.upload import router as upload_router
from .routes.analyze import router as analyze_router
from .routes.feedback import router as feedback_router
from .routes.platform import router as platform_router
from .routes.tasks import router as tasks_router
from .routes.vectors import router as vectors_router
from .routes.auth import router as auth_router
from .core.config import settings
from .db.session import init_db, ping_db
from .models import entities  # noqa: F401  # Ensure metadata is registered
import asyncio
from .db.session import AsyncSessionLocal
from .models.entities import RefreshToken
from sqlalchemy import delete
from datetime import datetime

@asynccontextmanager
async def lifespan(_: FastAPI):
    if settings.auto_create_tables:
        await init_db()
    # start background prune task
    stop = False

    async def _prune_loop():
        while True:
            try:
                async with AsyncSessionLocal() as session:
                    await session.execute(delete(RefreshToken).where(RefreshToken.expires_at != None).where(RefreshToken.expires_at < datetime.utcnow()))
                    await session.commit()
            except Exception:
                pass
            await asyncio.sleep(60 * 60)  # run hourly

    task = asyncio.create_task(_prune_loop())
    try:
        yield
    finally:
        task.cancel()


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router)
app.include_router(analyze_router)
app.include_router(feedback_router)
app.include_router(platform_router)
app.include_router(tasks_router)
app.include_router(vectors_router)
app.include_router(auth_router)


@app.get("/")
async def root():
    return {"message": "Backend running"}


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/health/db")
async def health_db():
    try:
        return {"status": "ok", "connected": await ping_db()}
    except Exception:
        return {"status": "degraded", "connected": False}

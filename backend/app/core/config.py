from __future__ import annotations

from dataclasses import dataclass
import os


def _get_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _normalize_database_url(url: str) -> str:
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


@dataclass(frozen=True, slots=True)
class Settings:
    app_name: str
    database_url: str
    auto_create_tables: bool
    openai_api_key: str | None
    gemini_api_key: str | None


settings = Settings(
    app_name=os.getenv("APP_NAME", "AI Resume Intelligence Platform"),
    database_url=_normalize_database_url(
        os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./resume_intelligence.db")
    ),
    auto_create_tables=_get_bool("AUTO_CREATE_TABLES", True),
    openai_api_key=os.getenv("OPENAI_API_KEY") or os.getenv("GEMINI_API_KEY") or None,
    gemini_api_key=os.getenv("GEMINI_API_KEY") or None,
)
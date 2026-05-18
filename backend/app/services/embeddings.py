from __future__ import annotations

from typing import Any
import os

try:
    import chromadb
except Exception:
    chromadb = None

from .openai_service import get_embeddings

from ..core.config import settings

CHROMA_DIR = os.getenv("CHROMA_PERSIST_DIR", ".chromadb")


def _get_client() -> Any:
    if chromadb is None:
        raise RuntimeError("chromadb is not installed")
    # Use simple local persistent Chroma directory
    try:
        client = chromadb.Client(chromadb.config.Settings(chroma_db_impl="duckdb+parquet", persist_directory=CHROMA_DIR))
    except Exception:
        # fallback to default client
        client = chromadb.Client()
    return client


def upsert_resume_vector(resume_id: str, text: str, metadata: dict | None = None) -> bool:
    """Compute embedding for `text` and upsert into Chroma collection keyed by `resume_id`."""
    embeddings = get_embeddings([text])
    if not embeddings:
        return False

    client = _get_client()
    collection = client.get_or_create_collection(name="resumes")
    collection.add(ids=[resume_id], documents=[text], metadatas=[metadata or {}], embeddings=embeddings)
    try:
        client.persist()
    except Exception:
        pass
    return True


def query_similar(text: str, n: int = 5) -> list[dict]:
    embeddings = get_embeddings([text])
    if not embeddings:
        return []
    client = _get_client()
    collection = client.get_or_create_collection(name="resumes")
    results = collection.query(query_embeddings=embeddings[0], n_results=n, include=['metadatas', 'distances', 'documents'])
    out = []
    for idx, id in enumerate(results.get("ids", [])):
        out.append({
            "id": id,
            "distance": results.get("distances", [[]])[idx][0] if results.get("distances") else None,
            "metadata": results.get("metadatas", [[]])[idx] if results.get("metadatas") else None,
            "document": results.get("documents", [[]])[idx] if results.get("documents") else None,
        })
    return out

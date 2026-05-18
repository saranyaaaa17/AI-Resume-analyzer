# AI Resume Analyzer - Backend (Prototype)

This is a small FastAPI backend scaffold to accept resume uploads and demonstrate a simple AI integration flow.

Quick start (Windows/macOS/Linux):

1. Create a virtual environment and activate it:

```bash
python -m venv venv
# Windows PowerShell
venv\Scripts\Activate.ps1
# macOS / Linux
source venv/bin/activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Run the server (development):

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

4. Open Swagger UI: http://127.0.0.1:8000/docs

- Notes:
- AI integration reads `OPENAI_API_KEY` first, then `GEMINI_API_KEY` as a fallback.
- Copy `.env.example` to `.env` and add your secrets for local runs.
- Uploaded files are saved to `backend/uploads`.
- JWT auth is enabled for task/vector endpoints; use `POST /auth/token` to get a local dev token.
- Admin-only reindex actions require a user with role `admin`. Run `python scripts/seed_admin.py` to create or promote one locally.

Docker:

```bash
cd backend
docker compose up --build
```

This exposes the API at http://127.0.0.1:8000 and persists uploaded resumes in `backend/uploads`.

### Cloud Run Dockerfile

The production Dockerfile uses Python 3.11 and starts `uvicorn app.main:app` on port `8080`, which is the Cloud Run default.

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

Notes:
- OpenAI integration is a stub. Set `OPENAI_API_KEY` in environment to enable it.
- Uploaded files are saved to `backend/uploads`.

Docker:

```bash
cd backend
docker compose up --build
```

This exposes the API at http://127.0.0.1:8000 and persists uploaded resumes in `backend/uploads`.

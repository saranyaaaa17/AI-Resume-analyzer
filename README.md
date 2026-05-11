# AI Resume Analyzer

Run the full stack with Docker Compose:

```bash
docker compose up --build
```

Frontend: http://127.0.0.1:5173
Backend: http://127.0.0.1:8000

The frontend build uses `VITE_API_BASE_URL=http://localhost:8000` so the browser can reach the backend through the published port.

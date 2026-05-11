from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app
from app.services.sample_pdf import build_sample_resume_pdf_bytes

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {"message": "Backend running"}


def test_upload_accepts_pdf(tmp_path, monkeypatch):
    import app.routes.upload as upload_module

    monkeypatch.setattr(upload_module, "UPLOAD_DIR", tmp_path.as_posix())

    pdf_bytes = build_sample_resume_pdf_bytes()
    response = client.post(
        "/upload",
        files={"file": ("resume.pdf", pdf_bytes, "application/pdf")},
    )

    assert response.status_code == 200
    assert response.json() == {"filename": "resume.pdf"}
    assert (tmp_path / "resume.pdf").exists()


def test_upload_rejects_non_pdf():
    response = client.post(
        "/upload",
        files={"file": ("resume.txt", b"plain text", "text/plain")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Only PDF files are allowed"


def test_analyze_returns_feedback(monkeypatch):
    import app.routes.analyze as analyze_module

    monkeypatch.setattr(analyze_module, "extract_text_from_bytes", lambda content: "Resume text extracted")
    monkeypatch.setattr(analyze_module, "request_feedback_from_openai", lambda text: f"feedback for: {text}")

    response = client.post(
        "/analyze",
        files={"file": ("resume.pdf", b"%PDF-1.4 fake", "application/pdf")},
    )

    assert response.status_code == 200
    assert response.json() == {
        "filename": "resume.pdf",
        "extracted_text": "Resume text extracted",
        "feedback": "feedback for: Resume text extracted",
    }


def test_feedback_returns_feedback(monkeypatch):
    import app.routes.feedback as feedback_module

    monkeypatch.setattr(feedback_module, "request_feedback_from_openai", lambda text: f"feedback for: {text}")

    response = client.post("/feedback", json={"text": "Improve metrics"})

    assert response.status_code == 200
    assert response.json() == {"feedback": "feedback for: Improve metrics"}

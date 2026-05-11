"""Manual smoke test for the /analyze endpoint.

This file is intentionally kept as a runnable script and should not be
collected by pytest.
"""

__test__ = False

import httpx

from app.services.sample_pdf import build_sample_resume_pdf_bytes


def main() -> None:
    url = "http://127.0.0.1:8000/analyze"
    pdf_bytes = build_sample_resume_pdf_bytes()
    files = {"file": ("sample-resume.pdf", pdf_bytes, "application/pdf")}
    response = httpx.post(url, files=files)
    print("status", response.status_code)
    print(response.json())


if __name__ == "__main__":
    main()

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.main import app
from fastapi.testclient import TestClient
from app.services.sample_pdf import build_sample_resume_pdf_bytes
import json

client = TestClient(app)

b = build_sample_resume_pdf_bytes()
files = {"file": ("resume.pdf", b, "application/pdf")}
resp = client.post('/analyze', files=files)
print('STATUS:', resp.status_code)
try:
    print(json.dumps(resp.json(), indent=2))
except Exception as e:
    print('RESPONSE TEXT:', resp.text)

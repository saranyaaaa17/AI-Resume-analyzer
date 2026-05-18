import os
from fastapi.testclient import TestClient

# ensure Celery eager mode is enabled before importing app/tasks
os.environ['CELERY_TASK_ALWAYS_EAGER'] = '1'

from app.main import app
from worker.sync_repo import get_resume_by_filename

client = TestClient(app)


def test_enqueue_and_run_eager():
    # build a small fake PDF bytes
    files = {"file": ("resume.pdf", b"%PDF-1.4 fake pdf content", "application/pdf")}
    # obtain token (passwordless demo)
    token_resp = client.post('/auth/token', json={'email': 'test@example.com'})
    assert token_resp.status_code == 200
    token = token_resp.json().get('access_token')
    headers = {'Authorization': f'Bearer {token}'}

    resp = client.post('/tasks/analyze', files=files, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert 'task_id' in data

    # Since Celery is running in eager mode, persistence should have happened synchronously
    resume = get_resume_by_filename('resume.pdf')
    assert resume is not None

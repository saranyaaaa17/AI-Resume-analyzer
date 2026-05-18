from __future__ import annotations

import os
from celery import Celery

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
CELERY_EAGER = os.getenv("CELERY_TASK_ALWAYS_EAGER", "0") == "1"

broker = REDIS_URL
backend = REDIS_URL
if CELERY_EAGER:
    # use in-memory broker/backend for tests
    broker = "memory://"
    backend = "cache+memory://"

celery_app = Celery(
    "resume_tasks",
    broker=broker,
    backend=backend,
)

# Optional: configure task serialization/timeouts here
celery_app.conf.update(task_serializer="json", accept_content=["json"], result_serializer="json")

# Propagate eager flag into celery config if requested
celery_app.conf.task_always_eager = CELERY_EAGER

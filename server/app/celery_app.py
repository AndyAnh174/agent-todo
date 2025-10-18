from celery import Celery
from .config import settings

# Create Celery instance
celery_app = Celery(
    "agent_todo",
    broker=settings.celery_broker_url,
    backend=settings.redis_url,
    include=[
        "app.tasks.notification_tasks",
        "app.tasks.embedding_tasks",
    ]
)

# Configure Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Ho_Chi_Minh",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
    # Fix the worker configuration
    worker_hijack_root_logger=False,
    worker_log_color=False,
    # Add proper task discovery
    task_always_eager=False,
    task_eager_propagates=True,
)

# Task routes
celery_app.conf.task_routes = {
    "app.tasks.notification_tasks.*": {"queue": "notifications"},
    "app.tasks.embedding_tasks.*": {"queue": "embeddings"},
}

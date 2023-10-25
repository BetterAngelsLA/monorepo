import os

from celery import Celery
from celery.schedules import crontab

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "betterangels_backend.settings")

app = Celery("betterangels-backend")

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
app.config_from_object("django.conf:settings", namespace="CELERY")

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

app.conf.beat_schedule = {
    # In case of a temporary delivery failure, we retry.
    "send-queued-mail": {
        "task": "post_office.tasks.send_queued_mail",
        "schedule": 600.0,  # 5 Minutes
    },
    # Cleanup old mail
    "cleanup-mail": {
        "task": "post_office.tasks.cleanup_mail",
        "schedule": crontab(minute=0, hour=7),  # 7 AM UTC, corresponds to midnight PT
        "kwargs": {"days": 90, "delete_attachments": True},
    },
}

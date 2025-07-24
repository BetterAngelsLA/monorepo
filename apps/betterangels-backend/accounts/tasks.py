from typing import Optional

from celery.utils.log import get_task_logger
from common.celery import single_instance
from django.db import connection as db_connection
from post_office.mail import get_queued, send_queued
from post_office.settings import get_celery_enabled

logger = get_task_logger(__name__)

try:
    if get_celery_enabled():
        from celery import Task, shared_task
    else:
        raise ImportError()
except (ImportError, NotImplementedError):
    # Fallback if Celery is not available or disabled
    def queued_mail_handler(sender: object, **kwargs: object) -> None:
        """
        Synchronous mail handler for non‑Celery environments.
        """
        # process the queue until empty
        while True:
            send_queued()
            db_connection.close()
            if not get_queued().exists():
                break

else:

    @shared_task(
        bind=True,
        name="post_office.tasks.send_queued_mail",
        ignore_result=True,
    )
    @single_instance(
        cache_alias="default",
        lock_key="celery-lock:post_office.tasks.send_queued_mail",
        lock_ttl=15,
        retry_delay=5,
    )
    def send_queued_mail(
        self: Task,
        processes: int = 1,
        log_level: Optional[int] = None,
    ) -> None:
        """
        Celery task override for post_office.tasks.send_queued_mail.
        Processes the queue in batches until empty, under a single-instance lock.
        """

        while True:
            try:
                send_queued(processes=processes, log_level=log_level)
            except Exception:
                logger.exception(e, extra={"status_code": 500})
                raise

            # Close DB connection to avoid multiprocessing errors
            db_connection.close()

            if not get_queued().exists():
                break

    def queued_mail_handler(sender: object, **kwargs: object) -> None:
        """
        Signal handler that enqueues our single‑instance Celery task.
        """
        send_queued_mail.delay()

import logging
from typing import Optional

from celery import Task, shared_task
from common.celery import single_instance
from django.db import connection as db_connection
from post_office.mail import get_queued, send_queued

logger = logging.getLogger(__name__)


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
    Custom replacement for post_office.tasks.send_queued_mail.
    Processes the queue in batches until empty, under a single-instance lock.
    """
    logger.info(
        "Starting send_queued_mail (task id=%s) with processes=%d, log_level=%s",
        self.request.id,
        processes,
        log_level,
    )

    while True:
        try:
            send_queued(processes=processes, log_level=log_level)
        except Exception:
            logger.exception(
                "Error sending queued mail",
                extra={"status_code": 500},
            )
            raise

        # Close DB connection to avoid multiprocessing errors
        db_connection.close()

        if not get_queued().exists():
            logger.info("Queue empty, send_queued_mail complete")
            break

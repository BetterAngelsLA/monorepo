"""Reports app Celery tasks."""

import logging
from datetime import datetime
from typing import Any

from celery import Task, shared_task
from common.celery import single_instance
from django.utils import timezone

from .models import ScheduledReport
from .services import generate_report_data, period_for_due_instant, send_report_email

logger = logging.getLogger(__name__)


@shared_task(bind=True)
@single_instance(
    lock_key="celery-lock:reports.tasks.process_scheduled_reports",
    lock_ttl=60 * 5,  # 5 minutes
)
def process_scheduled_reports(self: Task) -> str:
    """
    Dispatcher Task: Runs hourly (via Celery Beat) to check for reports due now.

    It finds active scheduled reports where next_run_at is in the past, and hands
    each one the due instant it was dispatched for.  A report stays due until its
    send advances ``next_run_at``, so the task must not re-read that instant later:
    a second dispatch in the window would read the advanced value and cover the
    month after the one it was queued for.
    """
    now = timezone.now()
    # Simple query: give me everything that is active and due
    reports_due = ScheduledReport.objects.filter(is_active=True, next_run_at__lte=now)

    for report in reports_due:
        send_scheduled_report.delay(report.pk, due_at=report.next_run_at)

    return f"Queued {len(reports_due)} reports for processing"


@shared_task(bind=True)
def send_scheduled_report(
    self: Task,
    report_id: int,
    *,
    due_at: datetime | None = None,
    recipient_override: str | None = None,
) -> dict[str, Any]:
    """
    Send a scheduled report via email.

    Args:
        report_id: The ID of the ScheduledReport to send.
        due_at: The instant this run was dispatched for. Callers pass the value they
            read when queueing, so the period cannot move between queueing and
            sending. Falls back to the stored schedule for direct invocation.
        recipient_override: If provided, send only to this email and do not update schedule.
    """
    try:
        report = ScheduledReport.objects.select_related("organization__profile").get(pk=report_id)
    except ScheduledReport.DoesNotExist:
        return {"status": "error", "message": f"ScheduledReport {report_id} not found"}

    # The period comes from the run being serviced, not from the clock and not from
    # whatever the schedule says by the time this task starts: a job that runs late,
    # on a retry, or twice must still report the month its own due date fell after.
    due_at = due_at or report.next_run_at
    if due_at is None:
        return {"status": "error", "message": f"ScheduledReport {report_id} has no due date"}

    # Another dispatch for this same period already advanced the schedule, so this
    # one is a duplicate. Discard it rather than emailing the month after.
    if report.next_run_at is not None and report.next_run_at > due_at:
        logger.warning(
            "Discarding stale dispatch for report %s: due %s, schedule already at %s",
            report_id,
            due_at,
            report.next_run_at,
        )
        return {"status": "skipped", "message": "Schedule already advanced for this period"}

    start_date, end_date = period_for_due_instant(due_at=due_at, org=report.organization)
    month_str = start_date.strftime("%m")
    year_str = start_date.strftime("%Y")

    # Generate content
    try:
        filename, csv_content, meta = generate_report_data(report, start_date, end_date)
    except ValueError as e:
        return {"status": "error", "message": str(e)}

    if not csv_content:
        return {"status": "error", "message": "No content generated"}

    # Calculate subject for email and return value
    subject = report.subject_template.format(month=month_str, year=year_str)

    if not recipient_override:
        # Update state
        # We update the state *before* sending the email so that if sending fails,
        # we don't end up in an infinite retry loop every hour. (At-most-once delivery)
        report.last_sent_at = timezone.now()
        report.set_next_run()  # Calculate for next month
        report.save(update_fields=["last_sent_at", "next_run_at"])

    # Send Email
    recipients = [recipient_override] if recipient_override else report.get_recipient_list()
    send_report_email(report, filename, csv_content, month_str, year_str, subject=subject, recipients=recipients)

    return {
        "status": "success",
        "report_id": report_id,
        "report_name": report.name,
        "recipients": recipients,
        "month": month_str,
        "test_run": bool(recipient_override),
        "year": year_str,
        "subject": subject,
        **meta,
    }

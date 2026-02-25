"""Reports app Celery tasks."""

import logging
from typing import Any

from celery import Task, shared_task
from common.celery import single_instance
from django.utils import timezone

from .models import ScheduledReport
from .services import generate_report_data, get_previous_month_range, send_report_email

logger = logging.getLogger(__name__)


@shared_task(bind=True)
@single_instance(
    lock_key="celery-lock:reports.tasks.process_scheduled_reports",
    lock_ttl=60 * 5,  # 5 minutes
)
def process_scheduled_reports(self: Task) -> str:
    """
    Dispatcher Task: Runs hourly (via Celery Beat) to check for reports due now.

    It finds active scheduled reports where next_run_at is in the past.
    """
    now = timezone.now()
    # Simple query: give me everything that is active and due
    reports_due = ScheduledReport.objects.filter(is_active=True, next_run_at__lte=now)

    for report in reports_due:
        send_scheduled_report.delay(report.pk)

    return f"Queued {len(reports_due)} reports for processing"


@shared_task(bind=True)
def send_scheduled_report(self: Task, report_id: int, recipient_override: str | None = None) -> dict[str, Any]:
    """
    Send a scheduled report via email.

    Args:
        report_id: The ID of the ScheduledReport to send.
        recipient_override: If provided, send only to this email and do not update schedule.
    """
    try:
        report = ScheduledReport.objects.select_related("organization").get(pk=report_id)
    except ScheduledReport.DoesNotExist:
        return {"status": "error", "message": f"ScheduledReport {report_id} not found"}

    # Calculate the date range for the previous month
    start_date, end_date = get_previous_month_range()
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

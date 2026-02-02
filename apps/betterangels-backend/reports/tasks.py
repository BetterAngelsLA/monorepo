"""Reports app Celery tasks."""

import logging
from datetime import datetime, timedelta
from typing import Any

from celery import Task, shared_task
from common.celery import single_instance
from django.core.files.base import ContentFile
from django.utils import timezone
from notes.admin import NoteResource
from notes.models import Note
from post_office import mail

from .models import ScheduledReport

logger = logging.getLogger(__name__)


def get_previous_month_range() -> tuple[datetime, datetime]:
    """
    Calculate the date range for the previous month.

    Returns:
        A tuple of (start_date, end_date) for the previous month,
        where start_date is inclusive and end_date is exclusive.
    """
    now = timezone.now()
    first_day_current = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    first_day_previous = (first_day_current - timedelta(days=1)).replace(day=1)
    return (first_day_previous, first_day_current)


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
        filename, csv_content, meta = _generate_report_data(report, start_date, end_date)
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
    _send_report_email(report, filename, csv_content, month_str, year_str, subject=subject, recipients=recipients)

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


def _generate_report_data(
    report: ScheduledReport, start_date: datetime, end_date: datetime
) -> tuple[str, str, dict[str, Any]]:
    """Generate the filename, content, and metadata for the report."""
    month_str = start_date.strftime("%m")
    year_str = start_date.strftime("%Y")

    if report.report_type == ScheduledReport.ReportType.INTERACTION_DATA:
        notes = Note.objects.filter(
            interacted_at__gte=start_date,
            interacted_at__lt=end_date,
            organization=report.organization,
        ).order_by("interacted_at")

        resource = NoteResource()
        dataset = resource.export(queryset=notes)
        filename = f"interaction_data_{month_str}_{year_str}.csv"
        return filename, dataset.csv, {"notes_count": notes.count()}

    raise ValueError(f"Unknown report type: {report.report_type}")


def _send_report_email(
    report: ScheduledReport,
    filename: str,
    content: str,
    month: str,
    year: str,
    subject: str,
    recipients: list[str] | None = None,
) -> None:
    """Send the email with the report attachment."""
    body = report.email_body.format(month=month, year=year)

    if recipients is None:
        recipients = report.get_recipient_list()

    mail.send(
        recipients=recipients,
        sender=report.from_email,
        subject=subject,
        message=body,
        attachments={
            filename: ContentFile(content.encode("utf-8")),
        },
    )

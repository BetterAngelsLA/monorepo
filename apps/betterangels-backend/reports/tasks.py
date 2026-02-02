"""Reports app Celery tasks."""

import logging
from typing import Any

from celery import Task, shared_task
from common.celery import single_instance
from django.core.files.base import ContentFile
from django.db import transaction
from django.utils import timezone
from notes.admin import NoteResource
from notes.models import Note
from post_office import mail

from .models import ScheduledReport
from .utils.report_utils import get_previous_month_range

logger = logging.getLogger(__name__)


@shared_task(bind=True)
@single_instance(
    lock_key="celery-lock:reports.tasks.process_scheduled_reports",
    lock_ttl=60 * 5,  # 5 minutes
)
def process_scheduled_reports(self: Task) -> str:
    """
    Dispatcher Task: Runs hourly (via Celery Beat) to check for reports due now.

    It finds active scheduled reports that match the current day of month and hour,
    and queues them for processing.
    """
    now = timezone.now()

    # Find active reports scheduled for today and this hour
    # We filter by frequency=MONTHLY (currently the only supported frequency)
    reports_due = list(
        ScheduledReport.objects.filter(
            is_active=True,
            frequency=ScheduledReport.Frequency.MONTHLY,
            day_of_month=now.day,
            hour=now.hour,
        )
    )

    for report in reports_due:
        send_scheduled_report.delay(report.pk)

    return f"Queued {len(reports_due)} reports for processing"


@shared_task(bind=True)
def send_scheduled_report(self: Task, report_id: int) -> dict[str, Any]:
    """
    Send a scheduled report via email.

    This task:
    1. Checks if the report has already been sent this month (idempotency)
    2. Queries the relevant data based on report_type
    3. Generates the export file
    4. Sends the email
    5. Updates the last_sent_at timestamp

    Args:
        report_id: The ID of the ScheduledReport to send
    """
    try:
        # Use select_for_update to lock the row and prevent race conditions
        with transaction.atomic():
            report = ScheduledReport.objects.select_for_update().select_related("organization").get(pk=report_id)

            # Idempotency Check: Don't send if already sent this month
            now = timezone.now()
            if report.last_sent_at:
                if report.last_sent_at.year == now.year and report.last_sent_at.month == now.month:
                    logger.info(f"Skipping report {report_id}: Already sent for {now.strftime('%Y-%m')}")
                    return {
                        "status": "skipped",
                        "reason": "already_sent_this_month",
                    }

            # Mark as sent immediately to update lock (although actual save happens at end)
            # ideally we save timestamp at the end of success, but we rely on transaction atomicity
            pass

    except ScheduledReport.DoesNotExist:
        return {
            "status": "error",
            "message": f"ScheduledReport with ID {report_id} not found",
        }

    # Calculate the date range for the previous month
    start_date, end_date = get_previous_month_range()

    # Format month/year keys for response/logging
    month_str = start_date.strftime("%m")
    year_str = start_date.strftime("%Y")

    csv_content = None
    filename = ""

    # Dispatch based on report type
    if report.report_type == ScheduledReport.ReportType.INTERACTION_DATA:
        # Query notes for the previous month and this organization
        notes = Note.objects.filter(
            interacted_at__gte=start_date,
            interacted_at__lt=end_date,
            organization=report.organization,
        ).order_by("interacted_at")

        # Generate CSV using NoteResource
        resource = NoteResource()
        dataset = resource.export(queryset=notes)
        csv_content = dataset.csv
        filename = f"interaction_data_{month_str}_{year_str}.csv"

        # Add metadata for return value
        result_meta = {"notes_count": notes.count()}

    else:
        # Handle unknown report types gracefully
        return {
            "status": "error",
            "message": f"Unknown report type: {report.report_type}",
        }

    if not csv_content:
        return {
            "status": "error",
            "message": "No content generated for report",
        }

    # Format email subject and body
    subject = report.subject_template.format(
        month=month_str,
        year=year_str,
    )

    body = report.email_body.format(
        month=month_str,
        year=year_str,
    )

    # Send email with attachment using django-post-office
    mail.send(
        recipients=report.get_recipient_list(),
        sender=report.from_email,
        subject=subject,
        message=body,
        attachments={
            filename: ContentFile(csv_content.encode("utf-8")),
        },
    )

    # Update last_sent_at
    report.last_sent_at = timezone.now()
    report.save(update_fields=["last_sent_at"])

    return {
        "status": "success",
        "report_id": report_id,
        "report_name": report.name,
        "recipients": report.get_recipient_list(),
        "subject": subject,
        "month": month_str,
        "year": year_str,
        **result_meta,
    }

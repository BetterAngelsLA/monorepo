"""Reports app Celery tasks."""

from typing import Any

from celery import Task, shared_task
from django.core.files.base import ContentFile
from django.utils import timezone
from notes.admin import NoteResource
from notes.models import Note
from post_office import mail

from .models import ScheduledReport
from .utils.report_utils import get_previous_month_range


@shared_task(bind=True)
def send_scheduled_report(self: Task, report_id: int) -> dict[str, Any]:
    """
    Send a scheduled report via email.

    This task:
    1. Retrieves the ScheduledReport configuration
    2. Queries the relevant data (notes) for the previous month
    3. Generates a CSV export using NoteResource (from django-import-export)
    4. Sends the report via email using django-post-office
    5. Updates the last_sent_at timestamp

    Args:
        report_id: The ID of the ScheduledReport to send

    Returns:
        A dictionary with status information
    """
    try:
        report = ScheduledReport.objects.select_related("organization").get(pk=report_id)  # type: ignore[attr-defined]
    except ScheduledReport.DoesNotExist:
        return {
            "status": "error",
            "message": f"ScheduledReport with ID {report_id} not found",
        }

    # Calculate the date range for the previous month
    start_date, end_date = get_previous_month_range()

    # Query notes for the previous month and this organization
    notes = Note.objects.filter(
        interacted_at__gte=start_date,
        interacted_at__lt=end_date,
        organization=report.organization,
    ).order_by("interacted_at")

    # Generate CSV using NoteResource from django-import-export
    resource = NoteResource()
    dataset = resource.export(queryset=notes)
    csv_content = dataset.csv

    # Format month/year for email templates
    month_str = start_date.strftime("%m")
    year_str = start_date.strftime("%Y")
    filename = f"interaction_data_{month_str}_{year_str}.csv"

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
        "notes_count": notes.count(),
        "recipients": report.get_recipient_list(),
        "subject": subject,
        "month": month_str,
        "year": year_str,
    }

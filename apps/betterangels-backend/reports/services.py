from datetime import datetime, timedelta
from typing import Any

from django.core.files.base import ContentFile
from django.utils import timezone
from notes.admin import NoteResource
from notes.models import Note
from post_office import mail

from .models import ScheduledReport


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


def generate_report_data(
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


def send_report_email(
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

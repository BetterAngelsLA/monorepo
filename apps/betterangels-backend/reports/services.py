from datetime import date, timedelta
from typing import Any

from django.core.files.base import ContentFile
from post_office import mail

from .exporters import ReportNoteResource
from .models import ScheduledReport
from .selectors import local_window, note_list_for_org


def get_previous_month_range(*, as_of: date) -> tuple[date, date]:
    """The calendar month preceding *as_of*, both bounds inclusive.

    Callers pass the date the report is *for* rather than today, so a job that
    runs late, early or on a retry still covers the month its schedule was due
    after.
    """
    last_day_previous = as_of.replace(day=1) - timedelta(days=1)
    return last_day_previous.replace(day=1), last_day_previous


def generate_report_data(report: ScheduledReport, start_date: date, end_date: date) -> tuple[str, str, dict[str, Any]]:
    """Generate the filename, content, and metadata for the report."""
    month_str = start_date.strftime("%m")
    year_str = start_date.strftime("%Y")

    if report.report_type == ScheduledReport.ReportType.INTERACTION_DATA:
        start, end = local_window(start_date, end_date)
        notes = note_list_for_org(org=report.organization, start=start, end=end).order_by("interacted_at")

        resource = ReportNoteResource()
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

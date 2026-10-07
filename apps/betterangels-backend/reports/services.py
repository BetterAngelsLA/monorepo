from datetime import date, datetime, timedelta
from typing import Any

from accounts.models import Organization
from django.core.files.base import ContentFile
from notes.admin import NoteResource
from post_office import mail

from .calendar import report_calendar_time_zone
from .models import ScheduledReport
from .selectors import note_list_for_org


def get_previous_month_range(*, as_of: date) -> tuple[date, date]:
    """The calendar month preceding *as_of*, both bounds inclusive.

    Callers pass the date the report is *for* rather than today, so a job that
    runs late, early or on a retry still covers the month its schedule was due
    after.
    """
    last_day_previous = as_of.replace(day=1) - timedelta(days=1)
    return last_day_previous.replace(day=1), last_day_previous


def period_for_due_instant(*, due_at: datetime, org: Organization) -> tuple[date, date]:
    """The month a report due at *due_at* covers, read on *org*'s calendar.

    *due_at* is the instant the run was due, not the moment it runs.  The calendar
    matters around the month boundary: a report due 00:00 UTC on the 1st is still
    the last day of the previous month in Los Angeles, and taken on UTC's calendar
    it would cover the month before that one.
    """
    org_date = due_at.astimezone(report_calendar_time_zone(org)).date()
    return get_previous_month_range(as_of=org_date)


def generate_report_data(report: ScheduledReport, start_date: date, end_date: date) -> tuple[str, str, dict[str, Any]]:
    """Generate the filename, content, and metadata for the report."""
    month_str = start_date.strftime("%m")
    year_str = start_date.strftime("%Y")

    if report.report_type == ScheduledReport.ReportType.INTERACTION_DATA:
        # One calendar for the range and the row labels: a label written on a
        # different one would not agree with the rows that were selected.
        org_time_zone = report_calendar_time_zone(report.organization)
        notes = note_list_for_org(
            org=report.organization, start_date=start_date, end_date=end_date, time_zone=org_time_zone
        ).order_by("interacted_at")

        resource = NoteResource(time_zone=org_time_zone)
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

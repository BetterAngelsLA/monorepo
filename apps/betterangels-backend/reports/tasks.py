"""Reports app Celery tasks."""

import logging
from dataclasses import dataclass
from datetime import date, datetime
from typing import Any

from celery import Task, shared_task
from django.utils import timezone

from common.celery import single_instance

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


@dataclass(frozen=True)
class _PreparedReport:
    """A generated report, ready to email."""

    filename: str
    content: str
    month: str
    year: str
    subject: str
    meta: dict[str, Any]


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

    A run is serviced at most once: the schedule is advanced with a conditional
    update, and whichever caller loses that race skips rather than sending again.

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
        logger.warning("ScheduledReport %s has no run to service", report_id)
        return {"status": "skipped", "message": "ScheduledReport has no due date"}

    start_date, end_date = period_for_due_instant(due_at=due_at, org=report.organization)

    # Build the period before touching the schedule, so a report that cannot be
    # built leaves the run unclaimed and the dispatcher retries it.  The claim below
    # still happens before the send, as it always has: state first means a failed
    # send costs one lost report rather than emailing every hour forever.
    try:
        prepared = _prepare_report(report, start_date, end_date)
    except ValueError as e:
        return {"status": "error", "message": str(e)}

    if recipient_override is None:
        # Claim the run by advancing the schedule in one conditional UPDATE. Two
        # workers handed the same due instant both reach here — `@shared_task` holds
        # no lock — and only the one whose UPDATE still matches a row sitting at
        # `due_at` advances it.  The loser is a duplicate and must not email.
        claimed = ScheduledReport.objects.filter(pk=report.pk, next_run_at=due_at).update(
            last_sent_at=timezone.now(),
            next_run_at=report.next_run_after(due_at),
        )
        if not claimed:
            logger.info("Skipping report %s: schedule no longer sits at due %s", report_id, due_at)
            return {"status": "skipped", "message": "Schedule already advanced for this period"}

    recipients = [recipient_override] if recipient_override else report.get_recipient_list()
    send_report_email(
        report,
        prepared.filename,
        prepared.content,
        prepared.month,
        prepared.year,
        subject=prepared.subject,
        recipients=recipients,
    )

    return {
        "status": "success",
        "report_id": report.pk,
        "report_name": report.name,
        "recipients": recipients,
        "month": prepared.month,
        "test_run": bool(recipient_override),
        "year": prepared.year,
        "subject": prepared.subject,
        **prepared.meta,
    }


def _prepare_report(report: ScheduledReport, start_date: date, end_date: date) -> _PreparedReport:
    """Build a period's report. Raises ``ValueError`` when there is nothing to send."""
    month_str = start_date.strftime("%m")
    year_str = start_date.strftime("%Y")

    filename, csv_content, meta = generate_report_data(report, start_date, end_date)
    if not csv_content:
        raise ValueError("No content generated")

    return _PreparedReport(
        filename=filename,
        content=csv_content,
        month=month_str,
        year=year_str,
        subject=report.subject_template.format(month=month_str, year=year_str),
        meta=meta,
    )

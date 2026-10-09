"""Reports app models."""

import re
from datetime import datetime
from typing import Any

from dateutil.relativedelta import relativedelta
from django.core.exceptions import ValidationError
from django.core.validators import EmailValidator, MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone

from accounts.models import Organization
from common.models import OrgScoped
from common.permissions.utils import permission_enums_to_django_meta_permissions

from .calendar import report_calendar_time_zone
from .permissions import ReportPermissions


def validate_email_list(value: str) -> None:
    """Validate that the input is a list of valid emails (separated by comma, semicolon, space, or newline)."""
    if not value.strip():
        raise ValidationError("At least one email address is required.")

    email_validator = EmailValidator()
    # Split by comma, semicolon, or whitespace (including newlines)
    emails = [email for email in re.split(r"[,\s;]+", value) if email]

    if not emails:
        raise ValidationError("At least one email address is required.")

    for email in emails:
        try:
            email_validator(email)
        except ValidationError:
            raise ValidationError(f"Invalid email address: {email}")


class ScheduledReport(OrgScoped, models.Model):
    """Model for scheduled reports that send data via email on a regular schedule.

    ``OrgScoped`` with the default ``org_via = ()`` (ADR 0001 §5.3): the model
    owns its ``organization`` FK, so ``reports.view_reports`` — which rides the
    scoped ORG_ADMIN/ORG_SUPERUSER Roles — is org-reachable (permissions.E005).
    """

    class Frequency(models.TextChoices):
        """Report frequency options."""

        MONTHLY = "monthly", "Monthly"
        # Future: WEEKLY = "weekly", "Weekly"

    class ReportType(models.TextChoices):
        """Type of report to generate."""

        INTERACTION_DATA = "interaction_data", "Interaction Data (Notes)"
        # Future: SERVICE_REQUESTS = "service_requests", "Service Requests"

    name = models.CharField(
        max_length=255,
        help_text="A descriptive name for this scheduled report",
    )
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="scheduled_reports",
        help_text="The organization this report is for",
    )
    report_type = models.CharField(
        max_length=50,
        choices=ReportType.choices,
        default=ReportType.INTERACTION_DATA,
        help_text="The type of data to include in the report",
    )
    recipients = models.TextField(
        help_text="List of email addresses to send the report to (separated by comma, semicolon, space, or newline)",
        validators=[validate_email_list],
    )
    frequency = models.CharField(
        max_length=20,
        choices=Frequency.choices,
        default=Frequency.MONTHLY,
        help_text="How often this report should be sent",
    )
    day_of_month = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(31)],
        help_text="Day of the month to send the report (1-31). If the month has fewer days, the last day of the month will be used.",
    )
    hour = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(23)],
        help_text="Hour of the day to send the report (0-23), in the site's time zone",
    )
    subject_template = models.CharField(
        max_length=255,
        default="BA Interaction Data for {month}/{year}",
        help_text="Email subject line template. Use {month} and {year} placeholders.",
    )
    email_body = models.TextField(
        default="Please find attached the interaction data for {month}/{year}.",
        help_text="Email body template. Use {month} and {year} placeholders.",
    )
    from_email = models.EmailField(
        default="noreply@betterangels.la",
        help_text="Email address to send from",
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this report is currently active",
    )
    last_sent_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this report was last sent",
    )
    next_run_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this report should be sent next",
        db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        """Model metadata."""

        verbose_name = "Scheduled Report"
        verbose_name_plural = "Scheduled Reports"
        ordering = ["-created_at"]
        permissions = permission_enums_to_django_meta_permissions([ReportPermissions])

    def __str__(self) -> str:
        """Return string representation."""
        return f"{self.name} ({self.get_frequency_display()})"

    def save(self, *args: Any, **kwargs: Any) -> None:
        """Save the model."""
        if self.next_run_at is None:
            self.set_next_run()

        super().save(*args, **kwargs)

    def next_run_after(self, anchor: datetime) -> datetime:
        """The firing after *anchor*, on this schedule's calendar.

        *anchor* is the run being serviced, not "now".  Anchoring on the clock
        instead makes a late run skip every firing between the two: a report due
        1 September but first serviced on 2 October would email August and then
        schedule November, and September's run would never be dispatched at all.
        From the run just serviced, the dispatcher catches up one period at a time.

        ``day_of_month`` and ``hour`` are read on the organization's calendar,
        deliberately ignoring any zone the request activated: following the browsing
        admin's zone would let a report set to 8am drift to 8am elsewhere on its
        first reschedule.  A schedule fires once, globally — it has no viewer.
        """
        local_anchor = anchor.astimezone(report_calendar_time_zone(self.organization))

        # ``relativedelta(day=N)`` replaces the day, clamping to the last valid day
        # of the month if the month is short (e.g. Feb 31 -> Feb 28).  This is the
        # "Last Day of Month" behavior when day=31.
        candidate = local_anchor + relativedelta(
            day=self.day_of_month,
            hour=self.hour,
            minute=0,
            second=0,
            microsecond=0,
        )

        # A candidate at or before the anchor is the run we just serviced, so the
        # next firing is a month on.
        if candidate <= local_anchor:
            candidate += relativedelta(months=1) + relativedelta(day=self.day_of_month)

        return candidate

    def set_next_run(self, *, anchor: datetime | None = None) -> None:
        """Point the schedule at its next firing — after *anchor*, or after now.

        Known limitation: ``save()`` only calls this when ``next_run_at`` is empty,
        so changing an organization's ``time_zone`` does not move a schedule that is
        already armed.  Until the first fire under the new calendar, the stored
        instant and the calendar the period is read on disagree.  Rescheduling live
        jobs on a config change is a product decision — an operator may not expect
        that to move every schedule — so it is left as a follow-up rather than
        inferred here.
        """
        self.next_run_at = self.next_run_after(anchor or timezone.now())

    def get_recipient_list(self) -> list[str]:
        """Parse the recipients field into a list of email addresses."""
        return [email for email in re.split(r"[,\s;]+", self.recipients) if email]

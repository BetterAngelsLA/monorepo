"""Reports app models."""

from typing import Any

from accounts.models import Organization
from dateutil.relativedelta import relativedelta
from django.core.exceptions import ValidationError
from django.core.validators import EmailValidator, MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone


def validate_email_list(value: str) -> None:
    """Validate that the input is a comma-separated list of valid emails."""
    if not value.strip():
        raise ValidationError("At least one email address is required.")

    email_validator = EmailValidator()
    emails = [email.strip() for email in value.split(",")]

    for email in emails:
        try:
            email_validator(email)
        except ValidationError:
            raise ValidationError(f"Invalid email address: {email}")


class ScheduledReport(models.Model):
    """Model for scheduled reports that send data via email on a regular schedule."""

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
        help_text="Comma-separated list of email addresses to send the report to",
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
        help_text="Hour of the day to send the report (0-23, UTC)",
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

    def __str__(self) -> str:
        """Return string representation."""
        return f"{self.name} ({self.get_frequency_display()})"

    def save(self, *args: Any, **kwargs: Any) -> None:
        """Save the model."""
        if self.next_run_at is None:
            self.set_next_run()

        super().save(*args, **kwargs)

    def set_next_run(self) -> None:
        """Calculate and set the next run time based on the schedule."""
        now = timezone.now()

        # Calculate candidate for current month.
        # relativedelta(day=N) replaces the day, clamping to the last valid day of month
        # if the month is short (e.g. Feb 31 -> Feb 28).
        # This matches the "Last Day of Month" behavior if day=31.
        candidate = now + relativedelta(
            day=self.day_of_month,
            hour=self.hour,
            minute=0,
            second=0,
            microsecond=0,
        )

        # If the candidate time has already passed, schedule for next month
        if candidate <= now:
            candidate += relativedelta(months=1) + relativedelta(day=self.day_of_month)

        self.next_run_at = candidate

    def get_recipient_list(self) -> list[str]:
        """Parse the recipients field into a list of email addresses."""
        return [email.strip() for email in self.recipients.split(",") if email.strip()]

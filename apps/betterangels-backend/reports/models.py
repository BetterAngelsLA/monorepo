"""Reports app models."""

from accounts.models import Organization
from django.core.exceptions import ValidationError
from django.core.validators import EmailValidator, MaxValueValidator, MinValueValidator
from django.db import models


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
        validators=[MinValueValidator(1), MaxValueValidator(28)],
        help_text="Day of the month to send the report (1-28)",
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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        """Model metadata."""

        verbose_name = "Scheduled Report"
        verbose_name_plural = "Scheduled Reports"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        """Return string representation."""
        return f"{self.name} ({self.get_frequency_display()})"  # type: ignore[attr-defined]

    def clean(self) -> None:
        """Validate the model."""
        super().clean()

        # Validate email list
        validate_email_list(self.recipients)

        # Validate day of month is reasonable
        if self.day_of_month < 1 or self.day_of_month > 28:
            raise ValidationError({"day_of_month": "Day of month must be between 1 and 28"})

        # Validate hour
        if self.hour < 0 or self.hour > 23:
            raise ValidationError({"hour": "Hour must be between 0 and 23"})

    def get_recipient_list(self) -> list[str]:
        """Parse the recipients field into a list of email addresses."""
        return [email.strip() for email in self.recipients.split(",") if email.strip()]

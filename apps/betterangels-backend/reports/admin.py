"""Reports app admin."""

from django.contrib import admin
from django.db.models import QuerySet
from django.http import HttpRequest

from .models import ScheduledReport
from .tasks import send_scheduled_report


@admin.register(ScheduledReport)
class ScheduledReportAdmin(admin.ModelAdmin):
    """Admin interface for ScheduledReport."""

    list_display = (
        "name",
        "organization",
        "frequency",
        "day_of_month",
        "hour",
        "is_active",
        "next_run_at",
        "last_sent_at",
    )
    list_filter = ("frequency", "is_active", "organization")
    search_fields = ("name", "recipients")
    readonly_fields = ("created_at", "updated_at", "last_sent_at", "next_run_at")
    actions = ["send_test_email_to_me", "run_schedule_now"]

    @admin.action(description="Send test email to me (does not update schedule)")
    def send_test_email_to_me(self, request: HttpRequest, queryset: QuerySet[ScheduledReport]) -> None:
        """Send a test email of the report to the current user."""
        # Use getattr to safely access email, satisfying Mypy's Union[User, AnonymousUser] check
        user_email = getattr(request.user, "email", None)

        if not user_email:
            self.message_user(request, "Error: You do not have an email address configured.", level="ERROR")
            return

        for report in queryset:
            send_scheduled_report.delay(report.pk, recipient_override=user_email)

        self.message_user(request, f"Queued {queryset.count()} test reports sent to {user_email}.")

    @admin.action(description="Run schedule now (sends to real recipients)")
    def run_schedule_now(self, request: HttpRequest, queryset: QuerySet[ScheduledReport]) -> None:
        """Run the selected reports immediately, updating the schedule."""
        for report in queryset:
            send_scheduled_report.delay(report.pk)

        self.message_user(request, f"Queued {queryset.count()} reports for immediate execution.")

    fieldsets = (
        (
            "Basic Information",
            {
                "fields": (
                    "name",
                    "organization",
                    "is_active",
                )
            },
        ),
        (
            "Schedule",
            {
                "fields": (
                    "frequency",
                    "day_of_month",
                    "hour",
                )
            },
        ),
        (
            "Email Configuration",
            {
                "fields": (
                    "recipients",
                    "from_email",
                    "subject_template",
                    "email_body",
                )
            },
        ),
        (
            "Metadata",
            {
                "fields": (
                    "created_at",
                    "updated_at",
                    "last_sent_at",
                ),
                "classes": ("collapse",),
            },
        ),
    )

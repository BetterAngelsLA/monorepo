"""Reports app admin."""

from django.contrib import admin
from django.http import HttpRequest

from .models import ScheduledReport


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
        "last_sent_at",
    )
    list_filter = ("frequency", "is_active", "organization")
    search_fields = ("name", "recipients")
    readonly_fields = ("created_at", "updated_at", "last_sent_at")

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

    def save_model(
        self,
        request: HttpRequest,
        obj: ScheduledReport,
        form: admin.options.ModelForm,  # type: ignore[name-defined]
        change: bool,
    ) -> None:
        """Save the model and show a message about the Celery Beat schedule."""
        super().save_model(request, obj, form, change)

        if obj.is_active:
            self.message_user(
                request,
                f"Celery Beat schedule created/updated: {obj._get_schedule_name()}",
            )
        else:
            self.message_user(
                request,
                f"Celery Beat schedule removed: {obj._get_schedule_name()}",
            )

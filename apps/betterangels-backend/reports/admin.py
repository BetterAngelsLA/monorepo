"""Reports app admin."""

from django.contrib import admin

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

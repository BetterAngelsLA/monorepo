from typing import Optional

from django.contrib import admin
from import_export.admin import ExportActionMixin
from rangefilter.filters import DateRangeFilterBuilder

from .models import Task


@admin.register(Task)
class TaskAdmin(ExportActionMixin, admin.ModelAdmin):

    list_display = (
        "task_summary",
        "client_profile_name",
        "created_by_name",
        "team",
        "organization",
        "status",
        "created_at",
        "updated_at",
        "note",
    )
    list_filter = (
        "organization",
        "status",
        ("created_at", DateRangeFilterBuilder()),
        ("updated_at", DateRangeFilterBuilder()),
    )
    search_fields = (
        "summary",
        "description",
        "client_profile__email",
        "client_profile__first_name",
        "client_profile__last_name",
        "client_profile__middle_name",
        "client_profile__nickname",
        "created_by__first_name",
        "created_by__last_name",
        "created_by__email",
        "organization__name",
    )
    readonly_fields = (
        "created_at",
        "updated_at",
    )

    def task_summary(self, obj: Task) -> str:
        return f"{obj.summary} ({obj.pk})"

    def created_by_name(self, obj: Task) -> Optional[str]:
        return (
            f"{obj.created_by.first_name} {obj.created_by.last_name} ({obj.created_by.pk})" if obj.created_by else None
        )

    def client_profile_name(self, obj: Task) -> Optional[str]:
        return (
            f"{obj.client_profile.first_name or ''} {obj.client_profile.last_name or ''} ({obj.client_profile.pk})"
            if obj.client_profile
            else None
        )

from typing import Optional

from common.models import PhoneNumber
from django.contrib import admin
from django.contrib.contenttypes.admin import GenericTabularInline
from django.urls import reverse
from django.utils.html import format_html

from .models import (
    ClientProfile,
    ClientProfileDataImport,
    ClientProfileImportRecord,
    HmisProfile,
)


class HmisProfileInline(admin.TabularInline):
    model = HmisProfile
    extra = 1


class PhoneNumberInline(GenericTabularInline):
    model = PhoneNumber
    extra = 1


@admin.register(ClientProfile)
class ClientProfileAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "id",
        "user__email",
        "user_id",
        "dob",
        "display_gender",
        "display_pronouns",
        "race",
        "eye_color",
        "hair_color",
        "preferred_language",
        "has_ca_id",
    ]
    inlines = [HmisProfileInline, PhoneNumberInline]

    def dob(self, obj: ClientProfile) -> Optional[str]:
        return obj.date_of_birth.isoformat() if obj.date_of_birth else None

    def has_ca_id(self, obj: ClientProfile) -> bool:
        return obj.california_id is not None

    def name(self, obj: ClientProfile) -> str:
        name_parts = list(filter(None, [obj.user.first_name, obj.user.middle_name, obj.user.last_name]))

        if obj.nickname:
            name_parts.append(f"({obj.nickname})")

        return " ".join(name_parts).strip()

    def user_id(self, obj: ClientProfile) -> str:
        return format_html(f'<a href="{reverse("admin:accounts_user_change", args=(obj.user.id,))}">{obj.user.id}</a>')

    search_fields = (
        "nickname",
        "user__email",
        "user__first_name",
        "user__last_name",
        "user__middle_name",
    )


# Data Import
@admin.register(ClientProfileDataImport)
class ClientProfileDataImportAdmin(admin.ModelAdmin):
    list_display = ("id", "imported_at", "source_file", "imported_by", "record_counts")
    readonly_fields = ("record_counts",)

    @admin.display(description="Import Record Counts")
    def record_counts(self, obj: ClientProfileDataImport) -> str:
        total = obj.records.count()
        successes = obj.records.filter(success=True).count()
        failures = total - successes
        return f"Total: {total} | Success: {successes} | Failures: {failures}"


@admin.register(ClientProfileImportRecord)
class ClientProfileImportRecordAdmin(admin.ModelAdmin):
    list_display = ("import_job__id", "source_name", "source_id", "client_profile", "success", "created_at")
    list_filter = ("import_job__id", "success")
    search_fields = ("source_id", "client_profile__id")
    readonly_fields = ("raw_data", "error_message")

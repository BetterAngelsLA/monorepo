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
    list_display = ["name", "id", "user__email", "user_id"]
    inlines = [HmisProfileInline, PhoneNumberInline]

    def name(self, obj: ClientProfile) -> str:
        return obj.user.full_name

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

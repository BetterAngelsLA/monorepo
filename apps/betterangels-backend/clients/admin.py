from common.models import PhoneNumber
from django.contrib import admin
from django.contrib.contenttypes.admin import GenericTabularInline

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
    list_display = ["name", "id"]
    inlines = [HmisProfileInline, PhoneNumberInline]

    def name(self, obj: ClientProfile) -> str:
        return obj.user.full_name


# Data Import


@admin.register(ClientProfileDataImport)
class ClientProfileDataImportAdmin(admin.ModelAdmin):
    list_display = ("id", "imported_at", "source_file", "imported_by", "record_counts")
    readonly_fields = ("record_counts",)

    def record_counts(self, obj: ClientProfileDataImport) -> str:
        total = obj.records.count()
        successes = obj.records.filter(success=True).count()
        failures = total - successes
        return f"Total: {total} | Success: {successes} | Failures: {failures}"

    record_counts.short_description = "Import Record Counts"  # type: ignore


@admin.register(ClientProfileImportRecord)
class ClientProfileImportRecordAdmin(admin.ModelAdmin):
    list_display = ("import_job__id", "source_name", "source_id", "client_profile", "success", "created_at")
    list_filter = ("import_job__id", "success")
    search_fields = ("source_id", "client_profile__id")
    readonly_fields = ("raw_data", "error_message")

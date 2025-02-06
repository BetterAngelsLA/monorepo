from django.contrib import admin

from .models import ClientProfile, HmisProfile, ProfileDataImport, ProfileImportRecord


class HmisProfileInline(admin.TabularInline):
    model = HmisProfile
    extra = 1


@admin.register(ClientProfile)
class ClientProfileAdmin(admin.ModelAdmin):
    list_display = ["name", "id"]
    inlines = [
        HmisProfileInline,
    ]

    def name(self, obj: ClientProfile) -> str:
        return obj.user.full_name


# Data Import


@admin.register(ProfileDataImport)
class ProfileDataImportAdmin(admin.ModelAdmin):
    list_display = ("id", "imported_at", "source_file", "imported_by", "record_counts")
    readonly_fields = ("record_counts",)

    def record_counts(self, obj: ProfileDataImport) -> str:
        total = obj.records.count()
        successes = obj.records.filter(success=True).count()
        failures = total - successes
        return f"Total: {total} | Success: {successes} | Failures: {failures}"

    record_counts.short_description = "Import Record Counts"


@admin.register(ProfileImportRecord)
class ProfileImportRecordAdmin(admin.ModelAdmin):
    list_display = ("source_id", "import_job", "client_profile", "success", "created_at")
    list_filter = ("import_job", "success")
    search_fields = ("source_id", "client_profile__id")
    readonly_fields = ("raw_data", "error_message")

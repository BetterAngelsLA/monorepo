from common.admin import AttachmentAdminMixin
from django.contrib import admin
from notes.enums import ServiceEnum

from .models import Mood, Note, NoteDataImport, NoteImportRecord, ServiceRequest, Task


@admin.register(Mood)
class MoodAdmin(admin.ModelAdmin):
    list_display = (
        "descriptor",
        "note",
        "note_client",
    )
    list_filter = (
        "descriptor",
        "created_at",
        "updated_at",
    )
    search_fields = (
        "note__title",
        "note__created_by__email",
        "note__client__email",
    )
    readonly_fields = ("created_at",)

    def note_client(self, obj: Mood) -> str:
        return str(obj.note.client)

    def created_by(self, obj: Mood) -> str:
        return str(obj.note.created_by)


class MoodInline(admin.TabularInline):
    model = Mood
    extra = 1


@admin.register(Note)
class NoteAdmin(AttachmentAdminMixin, admin.ModelAdmin):
    list_display = (
        "note_title",
        "client",
        "created_by",
        "organization",
        "interacted_at",
        "updated_at",
    )
    list_filter = (
        "is_submitted",
        "created_at",
        "updated_at",
    )
    search_fields = (
        "title",
        "public_details",
        "private_details",
        "created_by__email",
        "client__email",
        "organization__name",
    )
    inlines = [
        MoodInline,
    ]
    readonly_fields = (
        "attachments",
        "interacted_at",
        "updated_at",
    )

    def note_title(self, obj: Note) -> str:
        return f"{obj.title} ({obj.pk})"


@admin.register(Task)
class TaskAdmin(AttachmentAdminMixin, admin.ModelAdmin):
    list_display = (
        "title",
        "client",
        "due_by",
        "status",
    )
    list_filter = (
        "due_by",
        "status",
        "created_at",
        "updated_at",
    )
    search_fields = (
        "title",
        "created_by__email",
        "client__email",
    )
    readonly_fields = (
        "attachments",
        "created_at",
        "updated_at",
    )


@admin.register(ServiceRequest)
class ServiceRequestAdmin(admin.ModelAdmin):
    list_display = (
        "service_name",
        "status",
        "due_by",
        "completed_on",
        "client",
        "created_by",
        "created_at",
    )
    list_filter = (
        "service",
        "status",
        "due_by",
        "completed_on",
        "created_at",
        "updated_at",
    )
    search_fields = (
        "service",
        "created_by__email",
        "created_by__first_name",
        "created_by__last_name",
        "client__email",
        "client__first_name",
        "client__last_name",
    )
    readonly_fields = ("created_at",)

    @admin.display(description="Service")
    def service_name(self, obj: ServiceRequest) -> str:
        return str(obj.service.label if obj.service != ServiceEnum.OTHER else obj.service_other)


@admin.register(NoteDataImport)
class NoteDataImportAdmin(admin.ModelAdmin):
    list_display = ("id", "imported_at", "source_file", "imported_by", "record_counts")
    readonly_fields = ("record_counts",)

    @admin.display(description="Import Record Counts")
    def record_counts(self, obj: NoteDataImport) -> str:
        total = obj.records.count()
        successes = obj.records.filter(success=True).count()
        failures = total - successes
        return f"Total: {total} | Success: {successes} | Failures: {failures}"


@admin.register(NoteImportRecord)
class NoteImportRecordAdmin(admin.ModelAdmin):
    list_display = ("import_job__id", "source_name", "source_id", "note", "success", "created_at")
    list_filter = ("import_job__id", "success")
    search_fields = ("source_id", "note__id")
    readonly_fields = ("raw_data", "error_message")

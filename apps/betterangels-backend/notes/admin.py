from typing import Optional

from common.admin import AttachmentAdminMixin
from django.contrib import admin
from django.db.models import QuerySet
from import_export import fields, resources
from import_export.admin import ExportActionMixin
from import_export.formats.base_formats import CSV
from import_export.widgets import ForeignKeyWidget
from notes.enums import ServiceEnum
from organizations.models import Organization
from rangefilter.filters import DateRangeFilterBuilder

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
        "note__client_profile__email",
    )
    readonly_fields = ("created_at",)

    def note_client(self, obj: Mood) -> str:
        return str(obj.note.client)

    def created_by(self, obj: Mood) -> str:
        return str(obj.note.created_by)


class MoodInline(admin.TabularInline):
    model = Mood
    extra = 1


class NoteResource(resources.ModelResource):
    client_id = fields.Field(column_name="Client ID")
    interacted_at = fields.Field(column_name="Interacted At")
    purpose = fields.Field(column_name="Purpose")
    requested_services = fields.Field(column_name="Requested Services")
    provided_services = fields.Field(column_name="Provided Services")
    volunteer = fields.Field(column_name="Volunteer")
    location = fields.Field(column_name="Location")
    team = fields.Field(column_name="Team")
    organization = fields.Field(
        column_name="Organization",
        attribute="organization",
        widget=ForeignKeyWidget(Organization, field="name"),
    )
    notes = fields.Field(column_name="Notes")

    class Meta:
        model = Note
        fields = (
            "client_id",
            "interacted_at",
            "purpose",
            "provided_services",
            "requested_services",
            "volunteer",
            "location",
            "team",
            "organization",
            "notes",
        )

    def dehydrate_client_id(self, note: Note) -> int | str:
        if client_profile := note.client_profile:
            return str(client_profile.id)
        if note.client and hasattr(note.client, "client_profile"):
            return note.client.client_profile.id
        else:
            return "MISSING CLIENT ID"

    def dehydrate_interacted_at(self, note: Note) -> Optional[str]:
        return note.interacted_at.date().strftime("%m/%d/%Y") if note.interacted_at else None

    def dehydrate_purpose(self, note: Note) -> Optional[str]:
        return note.purpose or None

    def _join_services(self, services: QuerySet) -> str:
        return ", ".join(
            s.service_other if s.service == ServiceEnum.OTHER else s.get_service_display() for s in services
        )

    def dehydrate_requested_services(self, note: Note) -> str:
        return self._join_services(note.requested_services.all())

    def dehydrate_provided_services(self, note: Note) -> str:
        return self._join_services(note.provided_services.all())

    def dehydrate_volunteer(self, note: Note) -> Optional[str]:
        return note.created_by.full_name if note.created_by else None

    def dehydrate_location(self, note: Note) -> Optional[str]:
        return str(note.location) if note.location else None

    def dehydrate_team(self, note: Note) -> Optional[str]:
        return note.get_team_display()

    def dehydrate_notes(self, note: Note) -> Optional[str]:
        return note.public_details or None


@admin.register(Note)
class NoteAdmin(AttachmentAdminMixin, ExportActionMixin, admin.ModelAdmin):
    resource_class = NoteResource

    def get_export_formats(self) -> list:
        return [CSV]

    list_display = (
        "note_purpose",
        "client_profile",
        "created_by",
        "organization",
        "interacted_at",
        "updated_at",
    )
    list_filter = (
        ("interacted_at", DateRangeFilterBuilder()),
        "organization",
        "is_submitted",
        ("created_at", DateRangeFilterBuilder()),
        ("updated_at", DateRangeFilterBuilder()),
    )
    search_fields = (
        "purpose",
        "public_details",
        "private_details",
        "client_profile__email",
        "client_profile__first_name",
        "client_profile__last_name",
        "client_profile__middle_name",
        "client_profile__nickname",
        "created_by__email",
        "organization__name",
    )
    inlines = [
        MoodInline,
    ]
    readonly_fields = (
        "interacted_at",
        "updated_at",
    )

    def note_purpose(self, obj: Note) -> str:
        return f"{obj.purpose} ({obj.pk})"


@admin.register(Task)
class TaskAdmin(AttachmentAdminMixin, admin.ModelAdmin):
    list_display = (
        "title",
        "client_profile",
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
        "client_profile__email",
    )
    readonly_fields = (
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
        "client_profile",
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
        "client_profile__email",
        "client_profile__first_name",
        "client_profile__last_name",
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

from datetime import UTC
from typing import Any, Optional
from zoneinfo import ZoneInfo

from adminsortable2.admin import SortableAdminMixin, SortableStackedInline
from common.admin import AttachmentAdminMixin
from django.contrib import admin
from django.db.models import QuerySet
from django.utils import timezone
from import_export import fields, resources
from import_export.admin import ExportActionMixin
from import_export.formats.base_formats import CSV
from import_export.widgets import ForeignKeyWidget
from organizations.models import Organization
from rangefilter.filters import DateRangeFilterBuilder

from .models import (
    Note,
    NoteDataImport,
    NoteImportRecord,
    OrganizationService,
    OrganizationServiceCategory,
    ServiceRequest,
)


class NoteResource(resources.ModelResource):
    """Notes as a CSV, for the admin export, the API download and the emailed report.

    The calendar that decides which day a row falls on is the resource's
    ``time_zone``, not whichever zone a request happened to activate: the same
    month has to contain the same rows whether it was downloaded or emailed.
    """

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

    # Declared last to match where ``Meta.fields`` puts them.  The export order
    # follows that tuple, not this one, so the two are kept in step rather than
    # letting a reader assume the new columns sit beside ``interacted_at``.
    interacted_at_utc = fields.Field(column_name="Interacted At (UTC)")
    interacted_at_time_zone = fields.Field(column_name="Interacted At Time Zone")

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
            # Appended rather than placed beside ``interacted_at``: this resource
            # is a contract for three callers, and a consumer reading by position
            # is the only way adding a column can break one.
            "interacted_at_utc",
            "interacted_at_time_zone",
        )

    def __init__(self, *args: Any, time_zone: ZoneInfo | None = None, **kwargs: Any) -> None:
        """``time_zone`` names the calendar the rows are dated on.

        Optional so that the Django admin, which instantiates this resource with no
        kwargs, keeps working; it falls back to the site's zone, which is what the
        admin's own requests already resolve to.
        """
        self._requested_time_zone = time_zone
        self._time_zone: ZoneInfo | None = None
        super().__init__(*args, **kwargs)

    @property
    def time_zone(self) -> ZoneInfo:
        """The calendar in use, read once so every column agrees on it."""
        if self._time_zone is None:
            self._time_zone = self._requested_time_zone or timezone.get_default_timezone()
        return self._time_zone

    def dehydrate_client_id(self, note: Note) -> int | str:
        if client_profile := note.client_profile:
            return str(client_profile.id)
        else:
            return "MISSING CLIENT ID"

    def dehydrate_interacted_at(self, note: Note) -> Optional[str]:
        """The row's calendar day on the resource's clock.

        Localised to the zone a request activated, this date moves with whoever
        ran the export — out of step with the range the rows were filtered on, and
        with the same month's scheduled email.
        """
        if not note.interacted_at:
            return None
        return timezone.localtime(note.interacted_at, self.time_zone).strftime("%m/%d/%Y")

    def dehydrate_interacted_at_utc(self, note: Note) -> Optional[str]:
        """The same instant, unambiguously, for anything that has to reprocess it.

        ``Interacted At`` states a calendar without naming it.  This column lets a
        consumer check which one it was rather than assume — and it is the only
        column from which a different calendar could be derived, since the date
        alone has no time to convert.
        """
        if not note.interacted_at:
            return None
        return note.interacted_at.astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")

    def dehydrate_interacted_at_time_zone(self, note: Note) -> str:
        """The IANA name of the calendar ``Interacted At`` was written on."""
        return str(self.time_zone)

    def dehydrate_purpose(self, note: Note) -> Optional[str]:
        return note.purpose or None

    def _join_services(self, services: QuerySet) -> str:
        return ", ".join(str(s.service.label) for s in services)

    def dehydrate_requested_services(self, note: Note) -> str:
        return self._join_services(note.requested_services.all())

    def dehydrate_provided_services(self, note: Note) -> str:
        return self._join_services(note.provided_services.all())

    def dehydrate_volunteer(self, note: Note) -> Optional[str]:
        return note.created_by.full_name if note.created_by else None

    def dehydrate_location(self, note: Note) -> Optional[str]:
        return str(note.location) if note.location else None

    def dehydrate_team(self, note: Note) -> Optional[str]:
        return note.team.name if note.team else None

    def dehydrate_notes(self, note: Note) -> Optional[str]:
        return note.public_details or None


@admin.register(Note)
class NoteAdmin(AttachmentAdminMixin, ExportActionMixin, admin.ModelAdmin):
    resource_class = NoteResource

    def get_export_formats(self) -> list:
        return [CSV]

    autocomplete_fields = (
        "client_profile",
        "created_by",
        "location",
        "organization",
        "provided_services",
        "requested_services",
    )

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
    inlines = []
    readonly_fields = (
        "created_by",
        "interacted_at",
        "updated_at",
    )

    def note_purpose(self, obj: Note) -> str:
        return f"{obj.purpose} ({obj.pk})"


class OrganizationServiceInline(SortableStackedInline):
    ordering = ["priority"]
    model = OrganizationService
    extra = 0


@admin.register(OrganizationServiceCategory)
class OrganizationServiceCategoryAdmin(SortableAdminMixin, admin.ModelAdmin):
    inlines = [OrganizationServiceInline]
    ordering = ["priority"]
    list_display = (
        "name",
        "organization",
        "created_at",
    )
    list_filter = (
        "name",
        "organization",
        "created_at",
    )
    search_fields = (
        "name",
        "organization__name",
    )

    class Meta:
        model = OrganizationServiceCategory
        fields = "__all__"


@admin.register(ServiceRequest)
class ServiceRequestAdmin(admin.ModelAdmin):
    list_display = (
        "service_name",
        "service__category",
        "status",
        "due_by",
        "completed_on",
        "client_profile",
        "created_by",
        "created_at",
    )
    list_filter = (
        "service__category",
        "status",
        "due_by",
        "completed_on",
        "created_at",
        "updated_at",
    )
    search_fields = (
        "service__label",
        "service__category__name",
        "created_by__email",
        "created_by__first_name",
        "created_by__last_name",
        "client_profile__email",
        "client_profile__first_name",
        "client_profile__last_name",
    )
    readonly_fields = ("created_at",)

    @admin.display(description="Service")
    def service_name(self, obj: ServiceRequest) -> Optional[str]:
        return str(obj.service.label if obj.service else "")


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

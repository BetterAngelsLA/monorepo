from common.admin import AttachmentAdminMixin
from django.contrib import admin
from notes.enums import ServiceEnum

from .models import Mood, Note, ServiceRequest, Task


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
    readonly_fields = (
        "created_by",
        "created_at",
    )

    def note_client(self, obj: Mood) -> str:
        return obj.note.client.email if obj.note.client else ""

    def created_by(self, obj: Mood) -> str:
        return obj.note.created_by.email if obj.note.created_by else ""


class MoodInline(admin.TabularInline):
    model = Mood
    extra = 1


class NoteAdmin(AttachmentAdminMixin, admin.ModelAdmin):
    list_display = (
        "note_title",
        "client",
        "created_by",
        "organization",
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
        "created_by",
        "created_at",
        "updated_at",
    )

    def note_title(self, obj: Note) -> str:
        return f"{obj.title} ({obj.pk})"


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
        "created_by",
        "created_at",
        "updated_at",
    )


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

    @admin.display(description="Service")
    def service_name(self, obj: ServiceRequest) -> str:
        return str(
            obj.service.label
            if obj.service != ServiceEnum.OTHER
            else obj.custom_service
        )


admin.site.register(Mood, MoodAdmin)
admin.site.register(Note, NoteAdmin)
admin.site.register(ServiceRequest, ServiceRequestAdmin)
admin.site.register(Task, TaskAdmin)

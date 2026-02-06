from typing import Any

from common.models import Address, Attachment, Location
from common.widgets import AdminS3FileWidget
from django.apps import apps
from django.contrib import admin
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.db.models import Model
from django.urls import reverse
from django.utils.html import format_html
from django.utils.safestring import SafeString, mark_safe
from s3_file_field import S3FileField


class AttachmentAdminMixin:
    def attachments(self, obj: Model) -> SafeString:
        attachments = Attachment.objects.filter(
            content_type=ContentType.objects.get_for_model(obj),
            object_id=obj.pk,
        )
        attachment_links = [
            '<a href="{}">{}</a>'.format(
                reverse("admin:common_attachment_change", args=(attachment.id,)),
                f"Attachment {attachment.id}: {attachment}",
            )
            for attachment in attachments
        ]
        return format_html("<br>".join(attachment_links))


class LocationNoteAdminMixin:
    def notes(self, obj: Location) -> SafeString:
        Note = apps.get_model("notes", "Note")
        notes = list(Note.objects.filter(location=obj))

        note_links = [
            '<a href="{}">{}</a>'.format(
                reverse("admin:notes_note_change", args=(note.id,)),
                f"Note {note.id}: {note}",
            )
            for note in notes
        ]
        return format_html("<br>".join(note_links))


class LocationTaskAdminMixin:
    def tasks(self, obj: Location) -> SafeString:
        Task = apps.get_model("notes", "Task")
        tasks = list(Task.objects.filter(location=obj))

        task_links = [
            '<a href="{}">{}</a>'.format(
                reverse("admin:notes_task_change", args=(task.id,)),
                f"Task {task.id}: {task}",
            )
            for task in tasks
        ]
        return format_html("<br>".join(task_links))


@admin.register(Attachment)
class AttachmentAdmin(admin.ModelAdmin):
    list_display = (
        "get_str",
        "attachment_type",
        "content_object",
        "created_at",
        "updated_at",
    )
    list_filter = (
        "attachment_type",
        "created_at",
        "updated_at",
    )
    search_fields = (
        "id",
        "attachment_type",
    )
    readonly_fields = ("file_preview",)

    @admin.display(description="Preview")
    def file_preview(self, obj: Attachment) -> str:
        if not obj.pk or not obj.file:
            return ""
        url = obj.file.url
        mime = obj.mime_type or ""
        if mime.startswith("image/"):
            return mark_safe(f'<img src="{url}" style="max-height: 200px; max-width: 250px;" />')
        if mime.startswith("video/"):
            return mark_safe(
                f'<video src="{url}" style="max-height: 200px; max-width: 250px;"'
                f' controls preload="metadata"></video>'
            )
        if mime.startswith("audio/"):
            return mark_safe(f'<audio src="{url}" controls preload="metadata"></audio>')
        return mark_safe(f'<a href="{url}" target="_blank">{obj.original_filename or obj.file.name}</a>')

    @admin.display(description="Attachment")
    def get_str(self, obj: Attachment) -> str:
        return str(obj)

    def formfield_for_dbfield(self, db_field: models.Field, request: Any, **kwargs: Any) -> Any:  # type: ignore[override]
        if isinstance(db_field, S3FileField):
            kwargs["widget"] = AdminS3FileWidget
        return super().formfield_for_dbfield(db_field, request, **kwargs)


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    readonly_fields = ("address_components", "formatted_address")


@admin.register(Location)
class LocationAdmin(LocationNoteAdminMixin, LocationTaskAdminMixin, admin.ModelAdmin):
    list_display = (
        "formatted_address",
        "address",
        "point_coords",
        "point_of_interest",
    )
    search_fields = (
        "address",
        "point",
        "point_of_interest",
    )
    # TODO: Making `point` readonly removes the map display in admin. We want to show the map here,
    # but protecting Location objects from accidental modification is more important. The default map
    # display doesn't work well as is, and we'll probably want to replace it with google maps.
    exclude = ("point",)
    readonly_fields = (
        "point_coords",
        "address",
        "point_of_interest",
        "notes",
        "tasks",
    )

    def point_coords(self, obj: Location) -> str:
        return str(obj.point.coords)

    def formatted_address(self, obj: Location) -> str:
        return str(obj.address.formatted_address) if obj.address else ""

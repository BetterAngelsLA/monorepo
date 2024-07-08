from typing import TYPE_CHECKING, Any, Optional, Union

from common.enums import AttachmentType
from common.models import Attachment, Location
from django.apps import apps
from django.contrib import admin
from django.contrib.contenttypes.admin import GenericTabularInline
from django.contrib.contenttypes.models import ContentType
from django.db.models import FileField
from django.forms import FileInput
from django.http import HttpRequest
from django.urls import reverse
from django.utils.html import format_html
from django.utils.safestring import SafeString

if TYPE_CHECKING:
    from notes.models import Note, Task


class AttachmentAdminMixin:
    def attachments(self, obj: Union["Note", "Task"]) -> SafeString:
        attachments = Attachment.objects.filter(
            content_type=ContentType.objects.get_for_model(obj),
            object_id=obj.id,
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

    @admin.display(description="Attachment")
    def get_str(self, obj: Attachment) -> str:
        return str(obj)


class AttachmentInline(GenericTabularInline):
    model = Attachment
    extra = 1
    fields = [
        "get_thumbnail",
        # "original_filename",
        "file",
    ]
    readonly_fields = [
        "get_thumbnail",
        # "original_filename",
    ]

    formfield_overrides = {
        FileField: {"widget": FileInput(attrs={"class": "file-input"})},
    }

    @admin.display(description="Thumbnail")
    def get_thumbnail(self, obj: Attachment) -> str:
        max_width = "100px"
        max_height = "100px"

        if obj.file:
            mime_type = obj.mime_type
            attachment_type = obj.attachment_type

            if attachment_type == AttachmentType.IMAGE:
                return format_html(
                    '<a href="{}" target="_blank">'
                    '<img src="{}" style="max-width: {}; max-height: {};" alt="{}" />'
                    "</a>",
                    obj.file.url,
                    obj.file.url,
                    max_width,
                    max_height,
                    mime_type,
                )
            elif attachment_type == AttachmentType.VIDEO:
                return format_html(
                    '<a href="{}" target="_blank">'
                    '<video width="{}" height="{}" controls>'
                    '<source src="{}" type="{}">'
                    "Your browser does not support the video tag."
                    "</video>"
                    "</a>",
                    obj.file.url,
                    max_width,
                    max_height,
                    obj.file.url,
                    mime_type,
                )
            elif attachment_type == AttachmentType.DOCUMENT:
                return format_html(
                    '<a href="{}" target="_blank">'
                    '<img src="/static/icons/word-icon.png" style="max-width: {}; max-height: {};" alt="{}" />'
                    "</a>",
                    obj.file.url,
                    max_width,
                    max_height,
                    mime_type,
                )
            # Add more file type icons as needed
            else:
                return format_html(
                    '<a href="{}" target="_blank">'
                    '<img src="/static/icons/file-icon.png" style="max-width: {}; max-height: {};" alt="{}" />'
                    "</a>",
                    obj.file.url,
                    max_width,
                    max_height,
                    mime_type,
                )
        return "No file"


class SingleAttachmentInline(AttachmentInline):
    def get_max_num(self, request: HttpRequest, obj: Optional[Any] = None, **kwargs: Any) -> int:
        return 1


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


admin.site.register(Attachment, AttachmentAdmin)
admin.site.register(Location, LocationAdmin)

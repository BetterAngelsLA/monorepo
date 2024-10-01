from common.models import Address, Attachment, AttachmentModelForm, Location
from django.apps import apps
from django.contrib import admin
from django.contrib.contenttypes.models import ContentType
from django.db.models import Model
from django.urls import reverse
from django.utils.html import format_html
from django.utils.safestring import SafeString


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

    # N.B.: The below does not work, it seems to get hung up on something involving the CSS import
    change_form_template = "formset_admin_change_form.html"

    def get_form(self, request, obj=None, **kwargs):
        return AttachmentModelForm

    def add_view(self, request, form_url="", extra_context=None):
        if (
            request.method == "POST"
            and request.content_type == "multipart/form-data"
            and "temp_file" in request.FILES
            and "image_height" in request.POST
        ):
            return FileUploadMixin()._receive_uploaded_file(request.FILES["temp_file"], request.POST["image_height"])
        extra_context = extra_context or {}
        extra_context["click_actions"] = "disable -> submit -> reload !~ scrollToError"
        return super().add_view(request, form_url, extra_context)

    def change_view(self, request, object_id, form_url="", extra_context=None):
        extra_context = extra_context or {}
        extra_context["osm_data"] = self.get_osm_info()
        extra_context["click_actions"] = "disable -> submit -> reload !~ scrollToError"
        return super().change_view(
            request,
            object_id,
            form_url,
            extra_context=extra_context,
        )

    @admin.display(description="Attachment")
    def get_str(self, obj: Attachment) -> str:
        return str(obj)


class AddressAdmin(admin.ModelAdmin):
    readonly_fields = ("address_components", "formatted_address")


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


admin.site.register(Address, AddressAdmin)
admin.site.register(Attachment, AttachmentAdmin)
admin.site.register(Location, LocationAdmin)

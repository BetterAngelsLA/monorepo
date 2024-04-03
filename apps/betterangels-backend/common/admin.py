from typing import TYPE_CHECKING, Union

from common.models import Attachment
from django.contrib import admin
from django.contrib.contenttypes.models import ContentType
from django.urls import reverse
from django.utils.html import format_html
from django.utils.safestring import SafeString

if TYPE_CHECKING:
    from notes.models import Note, Task


class AttachmentAdminMixin(object):
    def attachments(self, obj: Union["Note", "Task"]) -> SafeString:
        attachments = Attachment.objects.filter(
            content_type=ContentType.objects.get_for_model(obj), object_id=obj.id
        )
        attachment_links = [
            '<a href="{}">{}</a>'.format(
                reverse("admin:common_attachment_change", args=(attachment.id,)),
                f"Attachment {attachment.id}: {attachment}",
            )
            for attachment in attachments
        ]
        return format_html("<br>".join(attachment_links))


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


admin.site.register(Attachment, AttachmentAdmin)

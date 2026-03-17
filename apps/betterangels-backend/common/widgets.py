from pathlib import Path
from typing import Any, Optional
from common.enums import ImagePresetEnum
from common.imgproxy import build_imgproxy_url, is_imgproxy_enabled
from django.contrib.admin.widgets import AdminFileWidget
from django.db.models.fields.files import FieldFile
from django.forms.renderers import BaseRenderer
from django.utils.html import format_html
from django.utils.safestring import SafeString, mark_safe

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tif", ".tiff", ".heic", ".heif"}


def _can_render_image_preview(field_file: object) -> bool:
    if not field_file or not hasattr(field_file, "url"):
        return False

    file_name = getattr(field_file, "name", "") or str(field_file)
    return Path(file_name).suffix.lower() in IMAGE_EXTENSIONS


def _render_preview_html(
    field_file: object,
    preset: Optional[ImagePresetEnum] = ImagePresetEnum.MD,
) -> str:
    if not _can_render_image_preview(field_file):
        return ""

    thumb_url = _get_thumb_url(field_file)
    if not thumb_url:
        return ""

    return format_html(
        '<div style="margin-bottom:8px">'
        '<img src="{}" style="max-height:200px;" />'
        "</div>",
        thumb_url,
    )


def _get_thumb_url(
    field_file: object
) -> Optional[str]:
    """Return an imgproxy-processed URL or fall back to the plain URL."""
    if is_imgproxy_enabled():
        url = build_imgproxy_url(field_file, preset=None, processing="f:jpg")
        if url:
            return url
    return getattr(field_file, "url", None)


class ImgproxyAdminImageWidget(AdminFileWidget):
    """Drop-in ``AdminFileWidget`` replacement that renders an imgproxy thumbnail
    above the file input for ``ImageField`` values.

    When imgproxy is disabled or unavailable the widget falls back to the
    original storage URL so the admin always shows a preview.
    """

    preview_preset: ImagePresetEnum = ImagePresetEnum.MD

    def render(
        self,
        name: str,
        value: Any,
        attrs: Optional[dict[str, Any]] = None,
        renderer: Optional[BaseRenderer] = None,
    ) -> SafeString:
        output = super().render(name, value, attrs, renderer)
        preview = _render_preview_html(value, preset=self.preview_preset)
        return preview + output if preview else output


def build_imgproxy_resumable_widget(base_widget_cls: type[Any]) -> type[Any]:
    """Create a resumable widget subclass once Django apps are ready."""

    class ImgproxyResumableAdminWidget(base_widget_cls):
        is_imgproxy_resumable_widget = True
        preview_preset: ImagePresetEnum = ImagePresetEnum.MD

        def render(
            self,
            name: str,
            value: Any,
            attrs: Optional[dict[str, Any]] = None,
            **kwargs: Any,
        ) -> SafeString:
            from django.conf import settings
            from django.contrib.contenttypes.models import ContentType
            from django.core.files.storage import default_storage
            from django.forms import CheckboxInput
            from django.template import loader

            if value:
                if isinstance(value, FieldFile):
                    field_storage = value.storage or default_storage
                    value_name = value.name
                else:
                    field_storage = default_storage
                    value_name = value
                file_name = value
                file_url = mark_safe(field_storage.url(value_name))
            else:
                file_name = ""
                file_url = ""

            chunk_size = getattr(settings, "ADMIN_RESUMABLE_CHUNKSIZE", "1*1024*1024")
            simultaneous_uploads = getattr(settings, "ADMIN_SIMULTANEOUS_UPLOADS", 3)
            content_type_id = ContentType.objects.get_for_model(self.attrs["model"]).id

            context = {
                "name": name,
                "value": value,
                "id": attrs["id"] if attrs else "",
                "chunk_size": chunk_size,
                "show_thumb": False,
                "field_name": self.attrs["field_name"],
                "content_type_id": content_type_id,
                "file_url": file_url,
                "file_name": file_name,
                "simultaneous_uploads": simultaneous_uploads,
            }

            if not self.is_required and attrs:
                template_with_clear = (
                    '<span class="clearable-file-input">%(clear)s '
                    '<label for="%(clear_checkbox_id)s">%(clear_checkbox_label)s</label></span>'
                )
                substitutions = {
                    "clear_checkbox_id": attrs["id"] + "-clear-id",
                    "clear_checkbox_name": attrs["id"] + "-clear",
                    "clear_checkbox_label": self.clear_checkbox_label,
                }
                substitutions["clear"] = CheckboxInput().render(
                    substitutions["clear_checkbox_name"],
                    False,
                    attrs={"id": substitutions["clear_checkbox_id"]},
                )
                context["clear_checkbox"] = mark_safe(template_with_clear % substitutions)

            output = loader.render_to_string(self.template_name, context)
            preview = _render_preview_html(value, preset=self.preview_preset)
            safe_output = SafeString(preview + output if preview else output)

            return safe_output

    return ImgproxyResumableAdminWidget


def patch_async_admin_widget() -> None:
    """Patch ``admin_async_upload`` to use the imgproxy preview widget."""

    from admin_async_upload import fields as async_fields
    from admin_async_upload import models as async_models

    widget_cls = async_models.ResumableAdminWidget
    if not getattr(widget_cls, "is_imgproxy_resumable_widget", False):
        widget_cls = build_imgproxy_resumable_widget(widget_cls)

    async_models.ResumableAdminWidget = widget_cls
    async_fields.ResumableAdminWidget = widget_cls
    async_fields.FormResumableFileField.widget = widget_cls

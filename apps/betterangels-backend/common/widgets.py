import functools
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


def _get_original_url(field_file: object) -> Optional[str]:
    if not field_file:
        return None

    if isinstance(field_file, FieldFile):
        return getattr(field_file, "url", None)

    return None


def _replace_file_url(html: SafeString | str, field_file: object) -> SafeString:
    original_url = _get_original_url(field_file)
    thumb_url = _get_thumb_url(field_file)
    if not original_url or not thumb_url:
        return mark_safe(html)

    return mark_safe(str(html).replace(original_url, thumb_url))


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


@functools.lru_cache(maxsize=1)
def build_imgproxy_resumable_widget() -> type[Any]:
    """Create the imgproxy-aware async widget once and reuse it."""

    from admin_async_upload.widgets import ResumableAdminWidget

    class ImgproxyResumableAdminWidget(ResumableAdminWidget):
        is_imgproxy_resumable_widget = True

        def render(
            self,
            name: str,
            value: Any,
            attrs: Optional[dict[str, Any]] = None,
            **kwargs: Any,
        ) -> SafeString:
            output = super().render(name, value, attrs, **kwargs)
            return _replace_file_url(output, value)

    return ImgproxyResumableAdminWidget


def patch_async_admin_widget() -> None:
    """Patch ``admin_async_upload`` to use the imgproxy preview widget."""

    from admin_async_upload import fields as async_fields
    from admin_async_upload import models as async_models

    widget_cls = build_imgproxy_resumable_widget()
    async_models.ResumableAdminWidget = widget_cls
    async_fields.ResumableAdminWidget = widget_cls
    async_fields.FormResumableFileField.widget = widget_cls

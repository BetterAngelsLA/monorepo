import functools
from typing import Any, Optional

from common.enums import ImagePresetEnum
from common.imgproxy import build_imgproxy_url, is_imgproxy_enabled
from django.contrib.admin.widgets import AdminFileWidget
from django.forms.renderers import BaseRenderer
from django.utils.html import format_html
from django.utils.safestring import SafeString


def __getattr__(name: str) -> Any:
    """Lazy-load ImgproxyResumableAdminWidget to avoid importing admin_async_upload
    at module load time (Django app registry is not ready yet).
    """
    if name == "ImgproxyResumableAdminWidget":
        return _get_imgproxy_resumable_admin_widget_class()
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


@functools.lru_cache(maxsize=1)
def _get_imgproxy_resumable_admin_widget_class() -> Any:
    try:
        from admin_async_upload.widgets import ResumableAdminWidget
    except ImportError:
        return None

    class ImgproxyResumableAdminWidget(ResumableAdminWidget):
        """Resumable admin file widget that uses imgproxy for the "Currently" link and
        thumbnail so only the processed image is shown, not the original.
        """

        def render(
            self,
            name: str,
            value: Any,
            attrs: Optional[dict[str, Any]] = None,
            **kwargs: Any,
        ) -> str:
            from django.core.files.storage import default_storage
            from django.db.models.fields.files import FieldFile
            from django.utils.safestring import mark_safe

            html = super().render(name, value, attrs, **kwargs)
            if not value:
                return html
            thumb_url = ImgproxyAdminImageWidget._get_thumb_url(
                value, preset=ImagePresetEnum.MD
            )
            if not thumb_url:
                return html
            if isinstance(value, FieldFile):
                original_url = (value.storage or default_storage).url(value.name)
            else:
                original_url = default_storage.url(value)
            return mark_safe(html.replace(original_url, thumb_url))

    return ImgproxyResumableAdminWidget


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

        if not value or not hasattr(value, "url"):
            return output

        thumb_url = self._get_thumb_url(value)
        if thumb_url:
            preview = format_html(
                '<div style="margin-bottom:8px">' '<img src="{}" style="max-height:200px;" />' "</div>",
                thumb_url,
            )
            return preview + output

        return output

    # ------------------------------------------------------------------

    @staticmethod
    def _get_thumb_url(
        field_file: object,
        preset: Optional[ImagePresetEnum] = ImagePresetEnum.MD,
    ) -> Optional[str]:
        """Return an imgproxy-processed URL or fall back to the plain URL."""
        if is_imgproxy_enabled():
            url = build_imgproxy_url(field_file, preset=preset, processing=None)
            if url:
                return url
        return getattr(field_file, "url", None)

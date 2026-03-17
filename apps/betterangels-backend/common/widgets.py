from typing import Any, Optional

from common.enums import ImagePresetEnum
from common.imgproxy import build_imgproxy_url, is_imgproxy_enabled
from django.contrib.admin.widgets import AdminFileWidget
from django.forms.renderers import BaseRenderer
from django.utils.html import format_html
from django.utils.safestring import SafeString


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

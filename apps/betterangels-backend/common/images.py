from typing import Optional

from common.enums import ImagePresetEnum
from common.imgproxy import build_imgproxy_url
from django.db.models.fields.files import FieldFile


def build_img_url(
    file: FieldFile, preset: Optional[ImagePresetEnum] = None, processing_options: Optional[str] = None
) -> str:
    """Return the best available image URL for *file*.

    Tries imgproxy first; falls back to the file's native storage URL.
    """
    if imgproxy_url := build_imgproxy_url(file, preset, processing_options):
        return imgproxy_url

    return file.url

import base64
import hashlib
import hmac
from typing import Optional, cast

from common.enums import ImagePresetEnum
from django.conf import settings

IMGPROXY_PRESETS = {
    ImagePresetEnum.ORIGINAL: "rs:force:0:0",
    ImagePresetEnum.SM: "rs:fill:50:50",
    ImagePresetEnum.MD: "rs:fill:100:100",
    ImagePresetEnum.LG: "rs:fill:500:500",
}


def _encode_source_url(url: str) -> str:
    return base64.urlsafe_b64encode(url.encode()).rstrip(b"=").decode()


def _sign_path(path: str) -> Optional[str]:
    """HMAC-SHA256(key, salt + path), URL-safe base64, no padding.

    See: https://github.com/imgproxy/imgproxy/blob/master/examples/signature.py
    """
    key_hex = settings.IMGPROXY_KEY
    salt_hex = settings.IMGPROXY_SALT

    if not key_hex or not salt_hex:
        return None

    key = bytes.fromhex(key_hex)
    salt = bytes.fromhex(salt_hex)
    digest = hmac.new(key, msg=salt + f"/{path}".encode(), digestmod=hashlib.sha256).digest()

    return base64.urlsafe_b64encode(digest).rstrip(b"=").decode()


def get_imgproxy_url(source_url: str, preset: ImagePresetEnum = ImagePresetEnum.ORIGINAL) -> Optional[str]:
    if preset not in IMGPROXY_PRESETS:
        return None

    return build_imgproxy_url(source_url, IMGPROXY_PRESETS[preset])


def build_imgproxy_url(source_url: str, processing: str = "") -> Optional[str]:
    """Return a signed imgproxy URL.

    Args:
        source_url: Source for imgproxy to fetch (e.g. "s3://bucket/key").
        processing: imgproxy processing options (e.g. "rs:fill:100:100").
                    Empty string = serve original.
    """
    base = settings.IMGPROXY_BASE_URL.rstrip("/")
    if not base:
        return None

    encoded = _encode_source_url(source_url)
    path = f"{processing}/{encoded}" if processing else encoded
    signature = _sign_path(path)

    return f"{base}/{signature}/{path}"


def get_imgproxy_source_url_from_file(file: Optional[object]) -> Optional[str]:
    """Return the source URL for imgproxy to fetch this file, or None if no file.

    Use this for any Django FileField/ImageField value. Works with S3 storage
    (s3_source_url), local/media with IMGPROXY_INTERNAL_BASE_URL, or plain file.url.
    """
    if not file:
        return None
    storage = getattr(file, "storage", None)
    name = getattr(file, "name", None)
    if not storage or not name:
        return None

    if hasattr(storage, "s3_source_url"):
        return cast(str, storage.s3_source_url(name))

    if settings.IMGPROXY_INTERNAL_BASE_URL:
        return f"{settings.IMGPROXY_INTERNAL_BASE_URL}/media/{name}"

    url = getattr(file, "url", None)

    return url if isinstance(url, str) else None

import base64
import datetime
import hashlib
import hmac
from typing import Optional, cast

import waffle
from common.enums import ImagePresetEnum
from django.conf import settings

IMGPROXY_SWITCH = "imgproxy_enabled"
IMGPROXY_PRESETS: dict[ImagePresetEnum, str] = {
    ImagePresetEnum.ORIGINAL: "rs:force:0:0",
    ImagePresetEnum.SM: "rs:fill:100:100/f:jpg",
    ImagePresetEnum.MD: "rs:fill:400:400/f:jpg",
    ImagePresetEnum.LG: "rs:fill:800:800/f:jpg",
}


def _resolve_imgproxy_ops(
    preset: Optional[ImagePresetEnum],
    processing: Optional[str],
) -> Optional[str]:
    if processing:
        return processing
    if preset:
        return IMGPROXY_PRESETS.get(preset)
    return None


def is_imgproxy_enabled() -> bool:
    """Runtime check: imgproxy is usable only when keys and waffle switch are set."""
    if not (settings.IMGPROXY_KEY and settings.IMGPROXY_SALT):
        return False

    return waffle.switch_is_active(IMGPROXY_SWITCH)


def _encode_source_url(url: str) -> str:
    return base64.urlsafe_b64encode(url.encode()).rstrip(b"=").decode()


def _get_imgproxy_signature(path: str) -> str:
    """HMAC-SHA256(key, salt + path), URL-safe base64, no padding.

    See: https://github.com/imgproxy/imgproxy/blob/master/examples/signature.py
    """
    key_hex = settings.IMGPROXY_KEY
    salt_hex = settings.IMGPROXY_SALT

    key = bytes.fromhex(key_hex)
    salt = bytes.fromhex(salt_hex)
    digest = hmac.new(key, msg=salt + f"/{path}".encode(), digestmod=hashlib.sha256).digest()

    return base64.urlsafe_b64encode(digest).rstrip(b"=").decode()


def _build_signed_imgproxy_path(source_url: str, ops: str = "") -> str:
    """Build the path portion of an imgproxy URL (no scheme/host).

    Returns e.g. ``<signature>/<processing>/<encoded_source>``
    or ``None`` when imgproxy HMAC keys are missing.
    """
    encoded = _encode_source_url(source_url)
    path = f"{ops}/{encoded}" if ops else encoded
    signature = _get_imgproxy_signature(path)

    return f"{signature}/{path}"


def _get_image_source_url(file: object) -> Optional[str]:
    """Return the source URL imgproxy should fetch for a Django file field value.

    Local dev: ``IMGPROXY_LOCAL_SOURCE_BASE_URL`` + media path, or ``file.url`` when
    ``IMGPROXY_LOCAL_URL`` is set. Production: only ``s3://bucket/key``; never
    ``file.url`` (that would be a presigned CloudFront URL, unsuitable as source).
    """
    name = getattr(file, "name", None)
    storage = getattr(file, "storage", None)

    if not storage or not name:
        return None

    if settings.IS_LOCAL_DEV:
        return f"{settings.IMGPROXY_LOCAL_SOURCE_BASE_URL}{settings.MEDIA_URL}{name}"

    try:
        return f"s3://{storage.bucket_name}/{storage.location}/{name}"
    except AttributeError:
        return None


def build_imgproxy_url(file: object, preset: Optional[ImagePresetEnum], processing: Optional[str]) -> Optional[str]:
    """Return a complete imgproxy URL, CloudFront-signed in production.

    URL construction strategy:
    * **Local dev** (``IMGPROXY_LOCAL_URL`` is set): returns a plain URL on that
      host — no CloudFront signing (there is no CloudFront locally).
    * **Production** (``IMGPROXY_LOCAL_URL`` is empty): builds the URL on the
      CloudFront ``custom_domain`` from the default storage and CF-signs it
      using the storage backend's existing signer.

    Args:
        file: The Django file field value to build the URL for.
        preset: The image preset to use.
        processing: The image processing options to use.

    Returns:
        The complete imgproxy URL, or None if the URL cannot be built.
    """

    ops = _resolve_imgproxy_ops(preset, processing)
    if not ops:
        return None

    source_url = _get_image_source_url(file)
    if not source_url:
        return None

    imgproxy_path = _build_signed_imgproxy_path(source_url, ops)

    if settings.IS_LOCAL_DEV:
        return f"{settings.IMGPROXY_LOCAL_URL}/{imgproxy_path}"

    storage = getattr(file, "storage", None)
    if not storage or not storage.cloudfront_signer or not settings.IMGPROXY_PATH_PREFIX:
        return None

    url = f"{storage.url_protocol}//{storage.custom_domain}/{settings.IMGPROXY_PATH_PREFIX}/{imgproxy_path}"

    expire_seconds: int = getattr(storage, "querystring_expire", 3600)
    expiration = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(seconds=expire_seconds)

    return cast(str, storage.cloudfront_signer.generate_presigned_url(url, date_less_than=expiration))

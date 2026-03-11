import base64
import hashlib
import hmac
from typing import Optional, cast

import waffle
from django.conf import settings

IMGPROXY_SWITCH = "imgproxy_enabled"


def is_imgproxy_enabled() -> bool:
    """Runtime check: imgproxy is usable only when keys, path prefix, and waffle switch are set."""
    prefix = getattr(settings, "IMGPROXY_PATH_PREFIX", "").strip("/")
    if not (settings.IMGPROXY_KEY and settings.IMGPROXY_SALT and prefix):
        return False

    return waffle.switch_is_active(IMGPROXY_SWITCH)


def _encode_source_url(url: str) -> str:
    return base64.urlsafe_b64encode(url.encode()).rstrip(b"=").decode()


def _sign_imgproxy_path(path: str) -> Optional[str]:
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


def _build_imgproxy_path(source_url: str, processing: str = "") -> Optional[str]:
    """Build the path portion of an imgproxy URL (no scheme/host).

    Returns e.g. ``[<prefix>/]<sig>/<processing>/<encoded_source>``
    or ``None`` when imgproxy HMAC keys are missing.
    """
    encoded = _encode_source_url(source_url)
    path = f"{processing}/{encoded}" if processing else encoded
    signature = _sign_imgproxy_path(path)
    if not signature:
        return None

    prefix = getattr(settings, "IMGPROXY_PATH_PREFIX", "").strip("/")
    if prefix:
        return f"{prefix}/{signature}/{path}"

    return f"{signature}/{path}"


def build_imgproxy_url(
    source_url: str,
    processing: str = "",
    storage: Optional[object] = None,
) -> Optional[str]:
    """Return a complete imgproxy URL, CloudFront-signed in production.

    URL construction strategy:
    * **Local dev** (``IMGPROXY_BASE_URL`` is set): returns a plain URL on that
      host — no CloudFront signing (there is no CloudFront locally).
    * **Production** (``IMGPROXY_BASE_URL`` is empty): builds the URL on the
      CloudFront ``custom_domain`` from the default storage and CF-signs it
      using the storage backend's existing signer.

    Args:
        source_url: What imgproxy should fetch (e.g. ``s3://bucket/key``).
        processing: imgproxy processing options (e.g. ``rs:fill:100:100``).
        storage: Storage instance whose CloudFront signer will be reused.
                 Falls back to ``default_storage`` when *None*.
    """
    imgproxy_path = _build_imgproxy_path(source_url, processing)
    if not imgproxy_path:
        return None

    # --- local dev shortcut: IMGPROXY_BASE_URL points directly at imgproxy ---
    if base := settings.IMGPROXY_BASE_URL.rstrip("/"):
        return f"{base}/{imgproxy_path}"

    # --- production: CloudFront domain + signing via storage backend ---
    if storage is None:
        from django.core.files.storage import default_storage

        storage = default_storage

    domain = getattr(storage, "custom_domain", None)
    if not domain:
        return None

    protocol: str = getattr(storage, "url_protocol", "https:")
    url = f"{protocol}//{domain}/{imgproxy_path}"

    # Reuse the storage's CloudFront signer (populated by django-storages
    # from cloudfront_key / cloudfront_key_id settings).
    if signer := getattr(storage, "cloudfront_signer", None):
        import datetime

        expire_seconds: int = getattr(storage, "querystring_expire", 3600)
        expiration = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(seconds=expire_seconds)

        return cast(str, signer.generate_presigned_url(url, date_less_than=expiration))

    return url


def get_imgproxy_source_url(file: Optional[object]) -> Optional[str]:
    """Return the source URL imgproxy should fetch for a Django file field value.

    Works with S3 storage (``s3://`` URI), local dev with
    ``IMGPROXY_INTERNAL_BASE_URL``, or a plain ``file.url``.
    """
    if not file:
        return None
    storage = getattr(file, "storage", None)
    name = getattr(file, "name", None)
    if not storage or not name:
        return None

    # S3 storage: build s3://bucket/key URI from standard attributes
    bucket_name = getattr(storage, "bucket_name", None)
    if bucket_name:
        location = getattr(storage, "location", "") or ""
        key = f"{location}/{name}" if location else name
        return f"s3://{bucket_name}/{key}"

    if settings.IMGPROXY_INTERNAL_BASE_URL:
        return f"{settings.IMGPROXY_INTERNAL_BASE_URL}/media/{name}"

    url = getattr(file, "url", None)

    return url if isinstance(url, str) else None

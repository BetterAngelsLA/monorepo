import secrets

from django.core.cache import cache

UPLOAD_SIGNATURE_PREFIX = "upload_sig:"
TTL_GRACE_PERIOD_SECONDS = 180  # 3 minutes


def create_upload_signature(*, key: str, user_id: int, expires_in_seconds: int) -> str:
    """
    Generate a random signature token, store it in Redis/Valkey cache
    mapped to the expected S3 key and user ID, and return the token.

    TTL is set to the presigned URL expiration plus a grace period.
    """
    ttl = expires_in_seconds + TTL_GRACE_PERIOD_SECONDS
    token = secrets.token_urlsafe(32)
    cache_key = f"{UPLOAD_SIGNATURE_PREFIX}{token}"
    cache.set(cache_key, {"key": key, "user_id": user_id}, timeout=ttl)

    return token


def validate_upload_signature(*, signature_key: str, key: str, user_id: int) -> bool:
    """
    Validate that the signature_key maps to the expected S3 key and user.
    Consumes the token on successful validation (single-use).
    """
    cache_key = f"{UPLOAD_SIGNATURE_PREFIX}{signature_key}"
    stored = cache.get(cache_key)

    if stored is None:
        return False

    if stored["key"] != key or stored["user_id"] != user_id:
        return False

    cache.delete(cache_key)
    return True

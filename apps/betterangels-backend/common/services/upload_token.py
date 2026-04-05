# apps/betterangels-backend/common/services/upload_token.py

import secrets

from django.core.cache import cache

UPLOAD_TOKEN_PREFIX = "upload_tkn:"
TTL_GRACE_PERIOD_SECONDS = 180  # 3 minutes


def create_upload_token(
    *,
    key: str,
    user_id: int,
    scope: str,
    expires_in_seconds: int,
) -> str:
    """
    Generate a random signature token, store it in Redis/Valkey cache
    mapped to the expected S3 key and user ID, and return the token.

    TTL is set to the presigned URL expiration plus a grace period.
    """
    ttl = expires_in_seconds + TTL_GRACE_PERIOD_SECONDS
    token = secrets.token_urlsafe(32)
    cache_key = f"{UPLOAD_TOKEN_PREFIX}{token}"

    cache.set(
        cache_key,
        {
            "key": key,
            "user_id": user_id,
            "scope": scope,
        },
        timeout=ttl,
    )

    return token


def validate_upload_token(
    *,
    upload_token: str,
    key: str,
    user_id: int,
    scope: str,
) -> bool:
    """
    Validate that the upload_token maps to the expected S3 key, user and scope.
    Consumes the token on successful validation (single-use).
    """
    cache_key = f"{UPLOAD_TOKEN_PREFIX}{upload_token}"
    stored = cache.get(cache_key)

    if stored is None:
        return False

    if stored["key"] != key:
        return False

    if stored["user_id"] != user_id:
        return False

    if stored.get("scope") != scope:
        return False

    cache.delete(cache_key)

    return True

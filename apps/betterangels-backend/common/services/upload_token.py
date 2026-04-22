from django.core.signing import BadSignature, SignatureExpired, TimestampSigner

TTL_GRACE_PERIOD_SECONDS = 180  # 3 minutes

_signer = TimestampSigner(salt="upload-token")


def create_upload_token(
    *,
    key: str,
    user_id: int,
    scope: str,
    expires_in_seconds: int,
) -> str:
    """
    Create an HMAC-signed token embedding the expected S3 key, user ID and scope.

    The token is stateless — no cache/Valkey storage is needed.
    max_age is embedded in the payload so validation is self-contained.
    """
    max_age = expires_in_seconds + TTL_GRACE_PERIOD_SECONDS
    return _signer.sign_object(
        {"key": key, "user_id": user_id, "scope": scope, "max_age": max_age},
        compress=True,
    )


def validate_upload_token(
    *,
    upload_token: str,
    key: str,
    user_id: int,
    scope: str,
) -> bool:
    """
    Validate that the signed upload_token contains the expected S3 key,
    user ID and scope, and has not expired.
    """
    try:
        payload = _signer.unsign_object(upload_token)
    except BadSignature:
        return False

    if payload.get("key") != key:
        return False

    if payload.get("user_id") != user_id:
        return False

    if payload.get("scope") != scope:
        return False

    # Call unsign with max_age to compare the token's
    # embedded creation timestamp against it
    max_age = payload.get("max_age")
    if max_age is not None:
        try:
            _signer.unsign(upload_token, max_age=max_age)
        except SignatureExpired:
            return False

    return True

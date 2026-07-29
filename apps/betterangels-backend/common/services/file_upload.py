"""
Generic presigned S3 upload service.

Provides a configuration-driven pipeline:
  1. Generate presigned S3 POST URLs with signed upload tokens.
  2. Client uploads files directly to S3 using the presigned URLs.
  3. Pre-flight validation (tokens, S3 keys, content types).
  4. Domain-specific persistence of upload records.

Domain services configure an ``AttachmentUploadConfig`` and handle
authorization (permission checks, permission assignment) themselves.
"""

from typing import Any, Iterable

from accounts.models import User
from common.models import Attachment
from common.services.exceptions import (
    InvalidContentTypeError,
    InvalidUploadTokenError,
    S3KeyNotFoundError,
)
from common.services.s3 import (
    PresignedS3UploadInput,
    generate_s3_presigned_upload_urls,
    s3_key_exists,
    strip_storage_location,
)
from common.services.types import (
    AttachmentUploadConfig,
    AuthorizedPresignedUpload,
    AuthorizedPresignedUploadBatch,
    UploadRequest,
    UploadConfirmation,
    ValidatedUpload,
)
from common.services.upload_token import create_upload_token, validate_upload_token
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.db import transaction


def _validate_content_type(content_type: str, filename: str, allowed: frozenset[str]) -> None:
    if content_type not in allowed:
        raise InvalidContentTypeError(f"Unsupported content_type: {content_type} for filename={filename}.")


def _validate_batch_content_types(
    uploads: Iterable[UploadRequest],
    config: AttachmentUploadConfig,
) -> None:
    """Validate every item's content type against the allowlist (fail-fast)."""
    for u in uploads:
        _validate_content_type(u.mime_type, u.filename, config.allowed_content_types)


def _validate_upload_item(
    item: UploadConfirmation,
    user: User,
    config: AttachmentUploadConfig,
) -> None:
    """Validate a single upload confirmation: content type → token → S3 key.

    Checks are ordered by cost and diagnostic value:
      1. Content type — cheap, gives clear “wrong kind of file” errors.
      2. Upload token — cryptographic, catches expired / tampered tokens.
      3. S3 key existence — I/O-bound, confirms the file was actually uploaded.
    """
    if item.mime_type:
        _validate_content_type(item.mime_type, item.filename, config.allowed_content_types)

    if not validate_upload_token(
        upload_token=item.upload_token,
        key=item.presigned_key,
        user_id=user.pk,
        scope=config.service_name,
    ):
        raise InvalidUploadTokenError(f"Invalid or expired upload signature for '{item.filename}'")

    if not s3_key_exists(key=item.presigned_key):
        raise S3KeyNotFoundError(f"File not found in storage for '{item.filename}'")


def create_presigned_uploads(
    *,
    user: User,
    uploads: Iterable[UploadRequest],
    config: AttachmentUploadConfig,
) -> AuthorizedPresignedUploadBatch:
    """Generate presigned S3 POST URLs and signed upload tokens for a batch.

    Validates content types, generates presigned URLs via S3, and wraps
    each result with a scoped, expiring upload token.
    """
    uploads = list(uploads)

    # Validate first — separate side effects from transformation.
    _validate_batch_content_types(uploads, config)

    s3_inputs = [
        PresignedS3UploadInput(
            ref_id=u.ref_id,
            filename=u.filename,
            mime_type=u.mime_type,
            upload_path=config.upload_path,
            max_file_size=config.max_file_size,
        )
        for u in uploads
    ]

    batch = generate_s3_presigned_upload_urls(uploads=s3_inputs)

    return AuthorizedPresignedUploadBatch(
        uploads=[
            AuthorizedPresignedUpload(
                ref_id=r.ref_id,
                url=r.url,
                fields=r.fields,
                presigned_key=r.key,
                upload_token=create_upload_token(
                    key=r.key,
                    user_id=user.pk,
                    expires_in_seconds=settings.S3_DEFAULT_PRESIGNED_UPLOAD_EXPIRATION_SECONDS,
                    scope=config.service_name,
                ),
            )
            for r in batch.uploads
        ]
    )


def validate_upload_batch(
    *,
    user: User,
    uploads: Iterable[UploadConfirmation],
    config: AttachmentUploadConfig,
) -> list[ValidatedUpload]:
    """Pre-flight validation: content types, tokens, and S3 keys.

    Validates every item in the batch before any database writes occur.
    Returns typed ``ValidatedUpload`` instances with ``file_path``
    populated.

    Raises:
        InvalidContentTypeError: If a content type is not in the allowlist.
        InvalidUploadTokenError: If a token is expired, tampered, or mismatched.
        S3KeyNotFoundError: If the file does not exist at the expected S3 key.
    """
    uploads = list(uploads)

    for item in uploads:
        _validate_upload_item(item, user, config)

    return [
        ValidatedUpload(
            filename=item.filename,
            mime_type=item.mime_type,
            namespace=item.namespace,
            file_path=strip_storage_location(item.presigned_key),
        )
        for item in uploads
    ]


def create_attachment_records(
    *,
    user: User,
    content_object: Any,
    uploads: Iterable[UploadConfirmation],
    config: AttachmentUploadConfig,
) -> list[Attachment]:
    """Validate upload tokens, confirm S3 objects exist, and persist Attachment rows.

    Calls ``validate_upload_batch`` for pre-flight validation, then opens a
    single ``transaction.atomic()`` block to create all Attachment rows.
    If any item fails validation, the entire batch is rolled back.

    **Does NOT assign object-level permissions** — that is the caller's
    responsibility.
    """
    items = validate_upload_batch(user=user, uploads=uploads, config=config)

    content_type = ContentType.objects.get_for_model(content_object.__class__)
    attached: list[Attachment] = []

    with transaction.atomic():
        for item in items:
            attachment = Attachment(
                file=item.file_path,
                mime_type=item.mime_type,
                original_filename=item.filename,
                namespace=item.namespace,
                content_type=content_type,
                object_id=content_object.id,
                uploaded_by=user,
            )

            attachment.save(direct_upload=True)
            attached.append(attachment)

    return attached

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
    GenerateUploadItem,
    ResolveUploadItem,
    ValidatedResolveItem,
)
from common.services.upload_token import create_upload_token, validate_upload_token
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.db import transaction


# ── Helpers ──────────────────────────────────────────────────────────────────


def _validate_content_type(content_type: str, filename: str, allowed: frozenset[str]) -> None:
    if content_type not in allowed:
        raise InvalidContentTypeError(f"Unsupported content_type: {content_type} for filename={filename}.")


def create_presigned_uploads(
    *,
    user: User,
    uploads: Iterable[GenerateUploadItem],
    config: AttachmentUploadConfig,
) -> AuthorizedPresignedUploadBatch:
    """Generate presigned S3 POST URLs and signed upload tokens for a batch.

    Validates content types, generates presigned URLs via S3, and wraps
    each result with a scoped, expiring upload token.
    """
    mapped_uploads: list[PresignedS3UploadInput] = []

    for upload in uploads:
        _validate_content_type(upload.mime_type, upload.filename, config.allowed_content_types)

        mapped_uploads.append(
            PresignedS3UploadInput(
                ref_id=upload.ref_id,
                filename=upload.filename,
                mime_type=upload.mime_type,
                upload_path=config.upload_path,
                max_file_size=config.max_file_size,
            )
        )

    presigned_batch = generate_s3_presigned_upload_urls(uploads=mapped_uploads)

    authorized_uploads: list[AuthorizedPresignedUpload] = []

    for item in presigned_batch.uploads:
        upload_token = create_upload_token(
            key=item.key,
            user_id=user.pk,
            expires_in_seconds=settings.S3_DEFAULT_PRESIGNED_UPLOAD_EXPIRATION_SECONDS,
            scope=config.service_name,
        )

        authorized_uploads.append(
            AuthorizedPresignedUpload(
                ref_id=item.ref_id,
                url=item.url,
                fields=item.fields,
                presigned_key=item.key,
                upload_token=upload_token,
            )
        )

    return AuthorizedPresignedUploadBatch(uploads=authorized_uploads)


# ── Validate batch ────────────────────────────────────────────────────────────


def validate_upload_batch(
    *,
    user: User,
    uploads: Iterable[ResolveUploadItem],
    config: AttachmentUploadConfig,
) -> list[ValidatedResolveItem]:
    """Pre-flight validation: content types, tokens, and S3 keys.

    Validates every item in the batch before any database writes occur.
    Returns typed ``ValidatedResolveItem`` instances with ``file_path``
    populated.

    Raises:
        InvalidContentTypeError: If a content type is not in the allowlist.
        InvalidUploadTokenError: If a token is expired, tampered, or mismatched.
        S3KeyNotFoundError: If the file does not exist at the expected S3 key.
    """
    items = list(uploads)
    validated: list[ValidatedResolveItem] = []

    for item in items:
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

        validated.append(
            ValidatedResolveItem(
                filename=item.filename,
                mime_type=item.mime_type,
                namespace=item.namespace,
                file_path=strip_storage_location(item.presigned_key),
            )
        )

    return validated


def create_attachment_records(
    *,
    user: User,
    content_object: Any,
    uploads: Iterable[ResolveUploadItem],
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

"""
Generic presigned S3 upload service for Attachment-based models.

Provides a configuration-driven pipeline for:
  1. Generating presigned S3 POST URLs with signed upload tokens.
  2. Resolving uploads: validating tokens, checking S3, and creating Attachment rows.

Domain services configure this with an AttachmentUploadConfig and handle
authorization (permission checks, permission assignment) themselves.
"""

from dataclasses import dataclass
from typing import Iterable, NotRequired, TypedDict

from accounts.models import User
from common.models import Attachment
from common.services.s3 import (
    DEFAULT_MAX_FILE_SIZE,
    DEFAULT_UPLOAD_EXPIRATION_SECONDS,
    PresignedS3UploadInput,
    generate_s3_presigned_upload_urls,
    s3_key_exists,
    strip_storage_location,
)
from common.services.types import AuthorizedPresignedUpload, AuthorizedPresignedUploadBatch
from common.services.upload_token import create_upload_token, validate_upload_token
from django.contrib.contenttypes.models import ContentType
from django.db import transaction


# ── Config ───────────────────────────────────────────────────────────────────


@dataclass(frozen=True)
class AttachmentUploadConfig:
    """Static configuration for a presigned attachment upload flow.

    Each domain (client documents, note attachments, etc.) instantiates
    one of these with its own upload_path, service_name, and content-type
    allowlist.
    """

    upload_path: str
    service_name: str
    allowed_content_types: frozenset[str]
    max_file_size: int = DEFAULT_MAX_FILE_SIZE


# ── Input types ──────────────────────────────────────────────────────────────


class GenerateUploadInput(TypedDict):
    """Per-file input for the *generate* phase (Phase 1)."""

    ref_id: str
    filename: str
    content_type: str


class ResolveUploadInput(TypedDict):
    """Per-file input for the *resolve* phase (Phase 3)."""

    presigned_key: str
    upload_token: str
    filename: str
    content_type: str
    namespace: NotRequired[str | None]


# ── Helpers ──────────────────────────────────────────────────────────────────


def _validate_content_type(content_type: str, filename: str, allowed: frozenset[str]) -> None:
    if content_type not in allowed:
        raise ValueError(f"Unsupported content_type: {content_type} for filename={filename}.")


# ── Phase 1: Generate presigned upload URLs ──────────────────────────────────


def create_presigned_uploads(
    *,
    user: User,
    uploads: Iterable[GenerateUploadInput],
    config: AttachmentUploadConfig,
) -> AuthorizedPresignedUploadBatch:
    """Generate presigned S3 POST URLs and signed upload tokens for a batch.

    Validates content types, generates presigned URLs via S3, and wraps
    each result with a scoped, expiring upload token.

    Args:
        user: The uploading user (token binds to ``user.pk``).
        uploads: Iterable of dicts with keys ``ref_id``, ``filename``, ``content_type``.
        config: Domain-specific configuration.

    Returns:
        ``AuthorizedPresignedUploadBatch`` ready to be mapped to a GraphQL response.
    """
    mapped_uploads: list[PresignedS3UploadInput] = []

    for upload in uploads:
        _validate_content_type(upload["content_type"], upload["filename"], config.allowed_content_types)

        mapped_uploads.append(
            {
                "ref_id": upload["ref_id"],
                "filename": upload["filename"],
                "content_type": upload["content_type"],
                "upload_path": config.upload_path,
                "max_file_size": config.max_file_size,
            }
        )

    presigned_batch = generate_s3_presigned_upload_urls(uploads=mapped_uploads)

    authorized_uploads: list[AuthorizedPresignedUpload] = []

    for item in presigned_batch["uploads"]:
        upload_token = create_upload_token(
            key=item["key"],
            user_id=user.pk,
            expires_in_seconds=DEFAULT_UPLOAD_EXPIRATION_SECONDS,
            scope=config.service_name,
        )

        authorized_uploads.append(
            {
                "ref_id": item["ref_id"],
                "url": item["url"],
                "fields": item["fields"],
                "presigned_key": item["key"],
                "upload_token": upload_token,
            }
        )

    return AuthorizedPresignedUploadBatch(uploads=authorized_uploads)


# ── Phase 3: Resolve uploads → Attachment records ────────────────────────────


def resolve_attachments(
    *,
    user: User,
    content_object,
    uploads: Iterable[ResolveUploadInput],
    config: AttachmentUploadConfig,
) -> list[Attachment]:
    """Validate upload tokens, confirm S3 objects exist, and persist Attachment rows.

    Performs a batch pre-flight (token validation + S3 existence check)
    before opening a single ``transaction.atomic()`` block to create all
    Attachment rows.  If any item fails validation, the entire batch is
    rolled back.

    **Does NOT assign object-level permissions** — that is the caller's
    responsibility.

    Args:
        user: The uploading user (token must match ``user.pk``).
        content_object: The Django model instance the attachments belong to
            (e.g. a ``ClientProfile`` or ``Note``).
        uploads: Iterable of dicts with keys ``presigned_key``, ``upload_token``,
            ``filename``, ``content_type``, and optionally ``namespace``.
        config: Domain-specific configuration.

    Returns:
        List of persisted ``Attachment`` instances.

    Raises:
        ValueError: If any token is invalid or the S3 key is missing.
    """
    # Materialize the iterable so we can iterate twice (validate then persist).
    items = list(uploads)

    # ── Pre-flight: validate every item before touching the DB ──────────
    for item in items:
        _validate_content_type(item["content_type"], item["filename"], config.allowed_content_types)

        if not validate_upload_token(
            upload_token=item["upload_token"],
            key=item["presigned_key"],
            user_id=user.pk,
            scope=config.service_name,
        ):
            raise ValueError(f"Invalid or expired upload signature for '{item['filename']}'")

        if not s3_key_exists(key=item["presigned_key"]):
            raise ValueError(f"File not found in storage for '{item['filename']}'")

    # ── Persist ─────────────────────────────────────────────────────────
    content_type = ContentType.objects.get_for_model(content_object.__class__)
    attached: list[Attachment] = []

    with transaction.atomic():
        for item in items:
            file_path = strip_storage_location(item["presigned_key"])

            attachment = Attachment(
                file=file_path,
                mime_type=item["content_type"],
                original_filename=item["filename"],
                namespace=item.get("namespace"),
                content_type=content_type,
                object_id=content_object.id,
                uploaded_by=user,
            )

            attachment.save(direct_upload=True)
            attached.append(attachment)

    return attached

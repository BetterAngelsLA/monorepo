from dataclasses import dataclass


@dataclass(frozen=True)
class AuthorizedPresignedUpload:
    ref_id: str
    presigned_key: str
    url: str
    fields: dict[str, str]
    upload_token: str


@dataclass(frozen=True)
class AuthorizedPresignedUploadBatch:
    uploads: list[AuthorizedPresignedUpload]


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
    max_file_size: int


@dataclass(frozen=True)
class UploadRequest:
    """Per-file input for the *generate* phase (Phase 1)."""

    ref_id: str
    filename: str
    mime_type: str


@dataclass(frozen=True)
class UploadConfirmation:
    """Per-file input for the *resolve* phase (Phase 3)."""

    presigned_key: str
    upload_token: str
    filename: str = ""
    mime_type: str = ""
    namespace: str | None = None


@dataclass(frozen=True)
class ValidatedUpload:
    """Output of ``validate_upload_batch`` — validated + enriched with ``file_path``.

    Domain services zip these back with their own typed items to access
    domain-specific fields (e.g. ``photo_type``) alongside the validated
    generic fields.
    """

    filename: str
    mime_type: str
    namespace: str | None
    file_path: str

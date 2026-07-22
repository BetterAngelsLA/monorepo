"""Exceptions for the presigned upload pipeline.

These allow the API layer to distinguish validation failures
(content type, token, S3 key) from other runtime errors without
parsing error message strings.
"""


class UploadValidationError(ValueError):
    """Base exception for upload pipeline validation failures."""


class InvalidContentTypeError(UploadValidationError):
    """Raised when the file's content type is not in the allowlist."""


class InvalidUploadTokenError(UploadValidationError):
    """Raised when the upload token is expired, tampered, or mismatched."""


class S3KeyNotFoundError(UploadValidationError):
    """Raised when the file does not exist at the expected S3 key."""

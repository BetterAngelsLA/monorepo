import uuid
from pathlib import Path
from typing import NotRequired, TypedDict, cast
from urllib.parse import urlparse, urlunparse

import boto3
from botocore.client import Config
from django.conf import settings
from django.core.files.storage import default_storage
from mypy_boto3_s3 import S3Client
from storages.backends.s3 import S3Storage

# generate_presigned_post
DEFAULT_UPLOAD_EXPIRATION_SECONDS = 300
DEFAULT_MAX_FILE_SIZE = 10_000_000


class PresignedS3UploadInput(TypedDict):
    ref_id: str
    filename: str
    content_type: str
    upload_path: str
    expires_in: NotRequired[int]
    max_file_size: NotRequired[int]


class S3ClientPresignedPostResponse(TypedDict):
    url: str
    fields: dict[str, str]


class PresignedS3UploadResult(TypedDict):
    ref_id: str
    url: str
    fields: dict[str, str]
    key: str


class PresignedS3UploadBatchResult(TypedDict):
    uploads: list[PresignedS3UploadResult]


def _rewrite_presigned_url_for_local(url: str) -> str:
    """
    Rewrite the host in a presigned POST URL from the local internal endpoint to the
    local public-facing endpoint when local S3 upload settings are enabled.

    Safe for presigned POST because the policy signature covers only the base64-encoded
    policy document (bucket, conditions, expiry) — not the Host header — so changing
    the hostname does not invalidate the signature.
    """
    local_internal_endpoint_url: str | None = getattr(default_storage, "endpoint_url", None) or None
    local_public_endpoint_url: str | None = settings.LOCAL_S3_PUBLIC_ENDPOINT_URL or None

    if not (local_internal_endpoint_url and local_public_endpoint_url):
        return url

    parsed_internal = urlparse(local_internal_endpoint_url)
    parsed_public = urlparse(local_public_endpoint_url)
    parsed_url = urlparse(url)

    if parsed_url.netloc == parsed_internal.netloc:
        return urlunparse(parsed_url._replace(scheme=parsed_public.scheme, netloc=parsed_public.netloc))

    return url


def _normalize_upload_path(upload_path: str) -> str:
    """
    Normalize upload_path to avoid leading/trailing slashes.
    """
    return upload_path.strip("/")


def _build_s3_key(*, filename: str, content_type: str, upload_path: str) -> str:
    """
    Build a deterministic S3 key relative to the storage `location`
    (e.g. "media/").

    Examples:
        upload_path="attachments"
            → attachments/<uuid>.jpg

        upload_path="attachments/drivers_license_front"
            → attachments/drivers_license_front/<uuid>.jpg

        upload_path=""
            → <uuid>.jpg
    """
    # TODO: derive extension
    # add mimetypes.guess_extension to common/files?
    # ext = mimetypes.guess_extension(content_type) or Path(filename).suffix

    ext = Path(filename).suffix
    uid = uuid.uuid4()

    if upload_path:
        return f"{upload_path}/{uid}{ext}"

    return f"{uid}{ext}"


def _generate_presigned_post_with_client(
    *,
    s3_client: S3Client,
    bucket_name: str,
    ref_id: str,
    filename: str,
    content_type: str,
    upload_path: str,
    expires_in: int | None = None,
    max_file_size: int | None = None,
) -> PresignedS3UploadResult:
    if expires_in is None:
        expires_in = DEFAULT_UPLOAD_EXPIRATION_SECONDS

    if max_file_size is None:
        max_file_size = DEFAULT_MAX_FILE_SIZE

    normalized_path = _normalize_upload_path(upload_path)
    key = _build_s3_key(
        filename=filename,
        content_type=content_type,
        upload_path=normalized_path,
    )

    conditions = [
        {"Content-Type": content_type},
        ["content-length-range", 0, max_file_size],
    ]

    if normalized_path:
        conditions.append(["starts-with", "$key", f"{normalized_path}/"])

    # TODO - ohter conditions?
    # conditions.append(["starts-with", "$key", ""]) # may be too loose
    # Optional: restrict content-type prefix?
    # -- ["starts-with", "$Content-Type", "image/"]

    response = cast(
        S3ClientPresignedPostResponse,
        s3_client.generate_presigned_post(
            Bucket=bucket_name,
            Key=key,
            Fields={"Content-Type": content_type},
            Conditions=conditions,
            ExpiresIn=expires_in,
        ),
    )

    fields = response.get("fields")
    fields_key = fields.get("key")

    if not fields_key:
        raise RuntimeError("Presigned POST response missing 'fields.key'")

    if fields_key != key:
        raise RuntimeError(f"Presigned POST key mismatch: expected '{key}', got '{fields_key}'")

    return {
        "ref_id": ref_id,
        "url": response["url"],
        "fields": fields,
        "key": key,
    }


def generate_s3_presigned_upload_urls(
    *,
    uploads: list[PresignedS3UploadInput],
) -> PresignedS3UploadBatchResult:
    storage = cast(S3Storage, default_storage)
    local_internal_endpoint_url: str | None = getattr(storage, "endpoint_url", None) or None
    bucket_name: str = storage.bucket_name
    signature_version: str = storage.signature_version
    addressing_style: str = storage.addressing_style

    s3_config = Config(
        signature_version=signature_version,
        s3={"addressing_style": addressing_style},  # type: ignore[arg-type]
    )

    client_kwargs: dict[str, object] = {
        "service_name": "s3",
        "config": s3_config,
    }

    if local_internal_endpoint_url:
        client_kwargs["endpoint_url"] = local_internal_endpoint_url

    s3_client = cast(S3Client, boto3.client(**client_kwargs))  # type: ignore[call-overload]

    results: list[PresignedS3UploadResult] = []

    for upload in uploads:
        result = _generate_presigned_post_with_client(
            s3_client=s3_client,
            bucket_name=bucket_name,
            ref_id=upload["ref_id"],
            filename=upload["filename"],
            content_type=upload["content_type"],
            upload_path=upload["upload_path"],
            expires_in=upload.get("expires_in"),
            max_file_size=upload.get("max_file_size"),
        )

        rewritten: PresignedS3UploadResult = {
            "ref_id": result["ref_id"],
            "url": _rewrite_presigned_url_for_local(result["url"]),
            "fields": result["fields"],
            "key": result["key"],
        }

        results.append(rewritten)

    return {"uploads": results}

import mimetypes
import uuid
from typing import NotRequired, TypedDict, cast

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
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
    ext = mimetypes.guess_extension(content_type)

    if not ext:
        raise ValueError(f"Unsupported content_type: {content_type} for filename={filename}")

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
        ["content-length-range", 1, max_file_size],
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


def _get_s3_client_and_bucket() -> tuple[S3Client, str]:
    storage = cast(S3Storage, default_storage)
    bucket_name: str = storage.bucket_name

    get_client_fn = getattr(storage, "get_client_for_presigned_urls", None)
    if callable(get_client_fn):
        s3_client: S3Client = get_client_fn()
    else:
        s3_config = Config(
            signature_version=storage.signature_version,
            s3={"addressing_style": storage.addressing_style},  # type: ignore[arg-type]
        )
        s3_client = boto3.client("s3", config=s3_config)

    return s3_client, bucket_name


def s3_key_exists(*, key: str) -> bool:
    """Check whether an object exists in the default S3 bucket."""
    s3_client, bucket_name = _get_s3_client_and_bucket()
    try:
        s3_client.head_object(Bucket=bucket_name, Key=key)
        return True
    except ClientError as exc:
        if exc.response["Error"]["Code"] == "404":
            return False
        raise


def generate_s3_presigned_upload_urls(
    *,
    uploads: list[PresignedS3UploadInput],
) -> PresignedS3UploadBatchResult:
    s3_client, bucket_name = _get_s3_client_and_bucket()

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
        results.append(result)

    return {"uploads": results}

# apps/betterangels-backend/common/services/s3.py

import uuid
from pathlib import Path
from typing import NotRequired, TypedDict, cast

import boto3
from botocore.client import Config
from django.conf import settings
from mypy_boto3_s3 import S3Client

S3_SIGNATURE_VERSION = "s3v4"
DEFAULT_EXPIRATION = 300
DEFAULT_MAX_FILE_SIZE = 10_000_000


class PresignedS3UploadInput(TypedDict):
    upload_ref: str
    filename: str
    content_type: str
    upload_path: str
    expires_in: NotRequired[int]
    max_file_size: NotRequired[int]


class S3ClientPresignedPostResponse(TypedDict):
    url: str
    fields: dict[str, str]


class PresignedS3UploadResult(TypedDict):
    upload_ref: str
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
    upload_ref: str,
    filename: str,
    content_type: str,
    upload_path: str,
    expires_in: int | None = None,
    max_file_size: int | None = None,
) -> PresignedS3UploadResult:
    if expires_in is None:
        expires_in = DEFAULT_EXPIRATION

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
    else:
        conditions.append(["starts-with", "$key", ""])

    # other conditions:
    # Optional: restrict content-type prefix?
    # -- ["starts-with", "$Content-Type", "image/"]

    response = cast(
        S3ClientPresignedPostResponse,
        s3_client.generate_presigned_post(
            Bucket=settings.AWS_S3_STORAGE_BUCKET_NAME,
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

    return PresignedS3UploadResult(
        upload_ref=upload_ref,
        url=response["url"],
        fields=fields,
        key=key,
    )


def generate_s3_presigned_upload_urls(
    *,
    uploads: list[PresignedS3UploadInput],
) -> PresignedS3UploadBatchResult:
    s3_client = boto3.client(
        "s3",
        config=Config(
            signature_version=S3_SIGNATURE_VERSION,
        ),
    )

    results: list[PresignedS3UploadResult] = []

    for upload in uploads:
        result = _generate_presigned_post_with_client(
            s3_client=s3_client,
            upload_ref=upload["upload_ref"],
            filename=upload["filename"],
            content_type=upload["content_type"],
            upload_path=upload["upload_path"],
            expires_in=upload.get("expires_in"),
            max_file_size=upload.get("max_file_size"),
        )

        results.append(result)

    return {"uploads": results}


# aws sso login
# check boto3 default creds usage -


# res = {
#     "url": "https://development-us-west-2-betterangels-backend.s3.amazonaws.com/",
#     "fields": {
#         "Content-Type": "image/jpg",
#         "key": "attachments/00299efa-a960-4650-8c2c-1507fbd9f274.jpg",
#         "AWSAccessKeyId": "ASIA3NE2EA5R777OFDA7",
#         "policy": "eyJleHBpcmF0aW9uIjogIjIwMjYtMDMtMjVUMjI6MzA6NTlaIiwgImNvbmRpdGlvbnMiOiBbeyJDb250ZW50LVR5cGUiOiAiaW1hZ2UvanBnIn0sIFsiY29udGVudC1sZW5ndGgtcmFuZ2UiLCAwLCAxMDAwMDAwMF0sIFsic3RhcnRzLXdpdGgiLCAiJGtleSIsICJhdHRhY2htZW50cy8iXSwgeyJidWNrZXQiOiAiZGV2ZWxvcG1lbnQtdXMtd2VzdC0yLWJldHRlcmFuZ2Vscy1iYWNrZW5kIn0sIHsia2V5IjogImF0dGFjaG1lbnRzLzAwMjk5ZWZhLWE5NjAtNDY1MC04YzJjLTE1MDdmYmQ5ZjI3NC5qcGcifV19",
#         "signature": "nvjPGAVFTEe7Z/IeFB9sahiIOmM=",
#     },
# }


generate_presigned_post_response = {
    "url": "https://development-us-west-2-betterangels-backend.s3.amazonaws.com/",
    "fields": {
        "Content-Type": "image/jpg",
        "key": "attachments/00299efa-a960-4650-8c2c-1507fbd9f274.jpg",
        "AWSAccessKeyId": "A....",
        "policy": "eyJ....",
        "signature": "nvjPGAVFTEe7Z/IeFB9sahiIOmM=",
    },
}

presigned_s3v4_response = {
    "url": "https://development-us-west-2-betterangels-backend.s3.amazonaws.com/",
    "fields": {
        "Content-Type": "image/jpeg",
        "key": "attachments/0d6982df-b63a-49b4-bb87-4d8590050164.jpg",
        "x-amz-algorithm": "AWS4-HMAC-SHA256",
        "x-amz-credential": "ASIA3NE2EA5R777OFDA7/20260325/us-west-2/s3/aws4_request",
        "x-amz-date": "20260325T223204Z",
        "policy": "eyJleHBpcmF0aW9uIjogIjIwMjYtMDMtMjVUMjI6Mzc6MDRaIiwgImNvbmRpdGlvbnMiOiBbeyJDb250ZW50LVR5cGUiOiAiaW1hZ2UvanBlZyJ9LCBbImNvbnRlbnQtbGVuZ3RoLXJhbmdlIiwgMCwgMTAwMDAwMDBdLCBbInN0YXJ0cy13aXRoIiwgIiRrZXkiLCAiYXR0YWNobWVudHMvIl0sIHsiYnVja2V0IjogImRldmVsb3BtZW50LXVzLXdlc3QtMi1iZXR0ZXJhbmdlbHMtYmFja2VuZCJ9LCB7ImtleSI6ICJhdHRhY2htZW50cy8wZDY5ODJkZi1iNjNhLTQ5YjQtYmI4Ny00ZDg1OTAwNTAxNjQuanBnIn0sIHsieC1hbXotYWxnb3JpdGhtIjogIkFXUzQtSE1BQy1TSEEyNTYifSwgeyJ4LWFtei1jcmVkZW50aWFsIjogIkFTSUEzTkUyRUE1Ujc3N09GREE3LzIwMjYwMzI1L3VzLXdlc3QtMi9zMy9hd3M0X3JlcXVlc3QifSwgeyJ4LWFtei1kYXRlIjogIjIwMjYwMzI1VDIyMzIwNFoifV19",
        "x-amz-signature": "376b072b23978d0fda4585a21e12d5377ae7afa527a67d7ffffcb6189384dd7a",
    },
}

presigned_s3v4_response_min = {
    "url": "https://development-us-west-2-betterangels-backend.s3.amazonaws.com/",
    "fields": {
        "Content-Type": "image/jpeg",
        "key": "attachments/0d6982df-b63a-49b4-bb87-4d8590050164.jpg",
        "x-amz-algorithm": "AWS4-HMAC-SHA256",
        "x-amz-credential": "ASIA3NE2EA5R777OFDA7/20260325/us-west-2/s3/aws4_request",
        "x-amz-date": "20260325T223204Z",
        "policy": "eyJleHBpcmF0aW9uIjogIjIwMjYtMDMtMjVUMjI6Mzc6MDRaIiwgImNvbmRpdGlvbnMiOiBbeyJDb250ZW50LVR5cGUiOiAiaW1hZ2UvanBlZyJ9LCBbImNvbnRlbnQtbGVuZ3RoLXJhbmdlIiwgMCwgMTAwMDAwMDBdLCBbInN0YXJ0cy13aXRoIiwgIiRrZXkiLCAiYXR0YWNobWVudHMvIl0sIHsiYnVja2V0IjogImRldmVsb3BtZW50LXVzLXdlc3QtMi1iZXR0ZXJhbmdlbHMtYmFja2VuZCJ9LCB7ImtleSI6ICJhdHRhY2htZW50cy8wZDY5ODJkZi1iNjNhLTQ5YjQtYmI4Ny00ZDg1OTAwNTAxNjQuanBnIn0sIHsieC1hbXotYWxnb3JpdGhtIjogIkFXUzQtSE1BQy1TSEEyNTYifSwgeyJ4LWFtei1jcmVkZW50aWFsIjogIkFTSUEzTkUyRUE1Ujc3N09GREE3LzIwMjYwMzI1L3VzLXdlc3QtMi9zMy9hd3M0X3JlcXVlc3QifSwgeyJ4LWFtei1kYXRlIjogIjIwMjYwMzI1VDIyMzIwNFoifV19",
        "x-amz-signature": "376b072b23978d0fda4585a21e12d5377ae7afa527a67d7ffffcb6189384dd7a",
    },
}

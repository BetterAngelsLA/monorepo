# apps/betterangels-backend/common/services/s3.py

import uuid
from pathlib import Path
from typing import TypedDict

import boto3
from botocore.client import Config
from django.conf import settings


def _normalize_upload_path(upload_path: str) -> str:
    """
    Normalize upload_path to avoid leading/trailing slashes.
    """
    return upload_path.strip("/")


def _build_s3_key(*, filename: str, upload_path: str) -> str:
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
    ext = Path(filename).suffix
    uid = uuid.uuid4()

    if upload_path:
        return f"{upload_path}/{uid}{ext}"

    return f"{uid}{ext}"

    # s3_client = boto3.client(
    #     "s3",
    #     aws_access_key_id=...,
    #     aws_secret_access_key=...,
    #     region_name=...,
    # )


class PresignedPostResult(TypedDict):
    url: str
    fields: dict[str, str]
    key: str


def generate_s3_presigned_post(
    *,
    filename: str,
    content_type: str,
    upload_path: str,
    expires_in: int = 300,  # 5 minutes
    max_file_size: int = 10_000_000,  # ≈ 9.54 MB
) -> PresignedPostResult:
    """
    Generate a presigned POST upload for S3.

    Notes:
    - `upload_path` must be relative to storage `location` (e.g. "media/")
    - Do NOT include "media/" in upload_path
    - Resulting S3 key will be: <location>/<key>
    """
    s3_client = boto3.client(
        "s3",
        config=Config(signature_version="s3v4"),
    )

    print("")
    print("******************* generate_s3_presigned_post")
    print()

    normalized_path = _normalize_upload_path(upload_path)
    key = _build_s3_key(filename=filename, upload_path=normalized_path)

    print(f"******************* {"normalized_path"}: {normalized_path}")
    print(f"******************* {"key"}: {key}")

    conditions = [
        {"Content-Type": content_type},
        ["content-length-range", 0, max_file_size],
    ]

    # Only enforce prefix restriction if a path is provided
    if normalized_path:
        conditions.append(["starts-with", "$key", f"{normalized_path}/"])
    else:
        # Allow any key at root
        conditions.append(["starts-with", "$key", ""])

    response = s3_client.generate_presigned_post(
        Bucket=settings.AWS_S3_STORAGE_BUCKET_NAME,
        Key=key,
        Fields={
            "Content-Type": content_type,
        },
        Conditions=conditions,
        ExpiresIn=expires_in,
    )

    print()
    print("| ------------- generate_s3_presigned_post  response  ------------- |")
    print(response)
    print()

    return PresignedPostResult(
        url=response["url"],
        fields=response["fields"],
        key=key,
    )


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

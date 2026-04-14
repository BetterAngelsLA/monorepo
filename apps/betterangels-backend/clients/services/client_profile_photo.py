from accounts.models import User
from clients.models import ClientProfile
from clients.types import GenerateClientProfilePhotoUploadInput
from common.constants import DEFAULT_IMAGE_CONTENT_TYPES
from common.services.s3 import (
    DEFAULT_UPLOAD_EXPIRATION_SECONDS,
    generate_s3_presigned_upload_urls,
    s3_key_exists,
    strip_storage_location,
)
from common.services.types import AuthorizedPresignedUpload
from common.services.upload_token import create_upload_token, validate_upload_token

UPLOAD_PATH = "client_profile_photos"
SERVICE_NAME = "client_profile_photo"

ALLOWED_CONTENT_TYPES = DEFAULT_IMAGE_CONTENT_TYPES


def _validate_content_type(content_type: str) -> None:
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise ValueError(f"Content type not allowed: {content_type}")


def create_presigned_upload(
    *,
    user: User,
    upload: GenerateClientProfilePhotoUploadInput,
) -> AuthorizedPresignedUpload:
    _validate_content_type(upload.content_type)

    presigned_urls = generate_s3_presigned_upload_urls(
        uploads=[
            {
                "ref_id": upload.ref_id,
                "filename": upload.filename,
                "content_type": upload.content_type,
                "upload_path": UPLOAD_PATH,
            }
        ]
    )

    result = presigned_urls["uploads"][0]

    upload_token = create_upload_token(
        key=result["key"],
        user_id=user.pk,
        expires_in_seconds=DEFAULT_UPLOAD_EXPIRATION_SECONDS,
        scope=SERVICE_NAME,
    )

    return {
        "ref_id": result["ref_id"],
        "presigned_key": result["key"],
        "url": result["url"],
        "fields": result["fields"],
        "upload_token": upload_token,
    }


def resolve_upload(
    *,
    user: User,
    client_profile: ClientProfile,
    presigned_key: str,
    upload_token: str,
) -> ClientProfile:
    if not validate_upload_token(
        upload_token=upload_token,
        key=presigned_key,
        user_id=user.pk,
        scope=SERVICE_NAME,
    ):
        raise ValueError("Invalid or expired upload signature")

    if not s3_key_exists(key=presigned_key):
        raise ValueError("File not found in storage")

    profile_photo_path = strip_storage_location(presigned_key)

    client_profile.profile_photo = profile_photo_path
    client_profile.save(update_fields=["profile_photo"])

    return client_profile

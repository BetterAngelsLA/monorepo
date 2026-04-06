# apps/betterangels-backend/clients/services/client_profile_photo.py
from typing import TypedDict

from accounts.models import User
from clients.models import ClientProfile
from clients.types import GenerateClientProfilePhotoUploadInput
from common.services.s3 import DEFAULT_UPLOAD_EXPIRATION_SECONDS, generate_s3_presigned_upload_urls
from common.services.upload_token import create_upload_token, validate_upload_token

STORAGE_DIR = "media"
CLIENT_PROFILE_PHOTO_PATH = f"{STORAGE_DIR}/client_profile_photos"
SERVICE_NAME = "client_profile_photo"


class AuthorizedPresignedUpload(TypedDict):
    ref_id: str
    presigned_key: str
    url: str
    fields: dict[str, str]
    upload_token: str


def create_presigned_upload(
    *,
    user: User,
    upload: GenerateClientProfilePhotoUploadInput,
) -> AuthorizedPresignedUpload:
    presigned_urls = generate_s3_presigned_upload_urls(
        uploads=[
            {
                "ref_id": upload.ref_id,
                "filename": upload.filename,
                "content_type": upload.content_type,
                "upload_path": CLIENT_PROFILE_PHOTO_PATH,
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

    storage_prefix = f"{STORAGE_DIR}/"

    if not presigned_key.startswith(storage_prefix):
        raise ValueError("Invalid storage key")

    # strip "media/"
    profile_photo_path = presigned_key[len(storage_prefix) :]

    client_profile.profile_photo = profile_photo_path
    client_profile.save(update_fields=["profile_photo"])

    return client_profile

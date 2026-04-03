from accounts.models import User
from clients.models import ClientProfile
from clients.types import GenerateClientProfilePhotoUploadInput
from common.services.s3 import (
    DEFAULT_UPLOAD_EXPIRATION_SECONDS,
    PresignedS3UploadResult,
    generate_s3_presigned_upload_urls,
)
from common.services.upload_signature import create_upload_signature, validate_upload_signature

STORAGE_DIR = "media"

CLIENT_PROFILE_PHOTO_PATH = f"{STORAGE_DIR}/client_profile_photos"


class SecurePresignedS3UploadResult(PresignedS3UploadResult):
    signature_key: str


def create_presigned_upload(
    *,
    user: User,
    upload: GenerateClientProfilePhotoUploadInput,
) -> SecurePresignedS3UploadResult:
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

    signature_key = create_upload_signature(
        key=result["key"],
        user_id=user.pk,
        expires_in_seconds=DEFAULT_UPLOAD_EXPIRATION_SECONDS,
    )

    return SecurePresignedS3UploadResult(
        key=result["key"],
        ref_id=result["ref_id"],
        url=result["url"],
        fields=result["fields"],
        signature_key=signature_key,
    )


def resolve_upload(
    *,
    user: User,
    client_profile: ClientProfile,
    file_path: str,
    signature_key: str,
) -> ClientProfile:
    if not validate_upload_signature(signature_key=signature_key, key=file_path, user_id=user.pk):
        raise ValueError("Invalid or expired upload signature")

    profile_photo_path = file_path[len(STORAGE_DIR) + 1 :]  # strip "media/"

    client_profile.profile_photo = profile_photo_path
    client_profile.save(update_fields=["profile_photo"])

    return client_profile

from accounts.models import User
from clients.models import ClientProfile
from clients.types import ClientProfilePhotoUploadInput
from common.services.s3 import PresignedS3UploadResult, generate_s3_presigned_upload_urls

STORAGE_DIR = "media"

CLIENT_PROFILE_PHOTO_PATH = f"{STORAGE_DIR}/client_profile_photos"


def create_client_profile_photo_presigned_upload(
    *,
    user: User,
    upload: ClientProfilePhotoUploadInput,
) -> PresignedS3UploadResult:
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

    return presigned_urls["uploads"][0]


def update_client_profile_photo_url(
    *,
    user: User,
    client_profile: ClientProfile,
    file_path: str,
) -> ClientProfile:
    if not file_path.startswith(CLIENT_PROFILE_PHOTO_PATH):
        raise ValueError(f"Invalid key: {file_path}")

    profile_photo_path = file_path[len(STORAGE_DIR) + 1 :]  # strip "media/"

    client_profile.profile_photo = profile_photo_path
    client_profile.save(update_fields=["profile_photo"])

    return client_profile

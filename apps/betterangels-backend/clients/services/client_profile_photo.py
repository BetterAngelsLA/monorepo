from accounts.models import User
from clients.models import ClientProfile
from common.constants import DEFAULT_IMAGE_CONTENT_TYPES
from common.services import attachment_upload
from common.services.attachment_upload import (
    AttachmentUploadConfig,
    GenerateUploadItem,
)
from common.services.s3 import s3_key_exists, strip_storage_location
from common.services.types import AuthorizedPresignedUpload
from common.services.upload_token import validate_upload_token

CLIENT_PROFILE_PHOTO_CONFIG = AttachmentUploadConfig(
    upload_path="client_profile_photos",
    service_name="client_profile_photo",
    allowed_content_types=DEFAULT_IMAGE_CONTENT_TYPES,
)


def create_presigned_upload(
    *,
    user: User,
    upload: GenerateUploadItem,
) -> AuthorizedPresignedUpload:
    """Generate a presigned S3 URL and upload token for a single profile photo (Phase 1)."""
    batch = attachment_upload.create_presigned_uploads(
        user=user,
        uploads=[upload],
        config=CLIENT_PROFILE_PHOTO_CONFIG,
    )
    return batch.uploads[0]


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
        scope=CLIENT_PROFILE_PHOTO_CONFIG.service_name,
    ):
        raise ValueError("Invalid or expired upload signature")

    if not s3_key_exists(key=presigned_key):
        raise ValueError("File not found in storage")

    profile_photo_path = strip_storage_location(presigned_key)

    client_profile.profile_photo = profile_photo_path
    client_profile.save(update_fields=["profile_photo"])

    return client_profile

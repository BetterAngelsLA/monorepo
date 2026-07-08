from accounts.models import User
from clients.models import ClientProfile
from common.constants import DEFAULT_IMAGE_CONTENT_TYPES
from common.services import attachment_upload
from common.services.attachment_upload import (
    AttachmentUploadConfig,
    GenerateUploadItem,
    ResolveUploadItem,
    validate_upload_batch,
)
from common.services.types import AuthorizedPresignedUpload
from django.conf import settings

CLIENT_PROFILE_PHOTO_CONFIG = AttachmentUploadConfig(
    upload_path="client_profile_photos",
    service_name="client_profile_photo",
    allowed_content_types=DEFAULT_IMAGE_CONTENT_TYPES,
    max_file_size=settings.S3_DEFAULT_PRESIGNED_MAX_FILE_SIZE,
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
    # Profile photos are always single-upload; pick the first (only) item.
    return batch.uploads[0]


def resolve_upload(
    *,
    user: User,
    client_profile: ClientProfile,
    presigned_key: str,
    upload_token: str,
) -> ClientProfile:
    """Validate tokens + S3 → set client_profile.profile_photo (Phase 3)."""
    validated = validate_upload_batch(
        user=user,
        uploads=[
            ResolveUploadItem(
                presigned_key=presigned_key,
                upload_token=upload_token,
            )
        ],
        config=CLIENT_PROFILE_PHOTO_CONFIG,
    )

    client_profile.profile_photo = validated[0].file_path
    client_profile.save(update_fields=["profile_photo"])

    return client_profile

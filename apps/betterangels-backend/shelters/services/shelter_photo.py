from typing import Iterable

from accounts.models import User
from common.constants import DEFAULT_IMAGE_CONTENT_TYPES
from common.services.attachment_upload import (
    AttachmentUploadConfig,
    create_presigned_uploads as generic_create_presigned_uploads,
    validate_upload_batch,
)
from common.services.types import AuthorizedPresignedUploadBatch
from common.utils import get_by_pk_or_not_found
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from shelters.enums import ShelterPhotoTypeChoices
from shelters.models import ShelterPhoto
from shelters.selectors import shelter_get, shelter_queryset
from shelters.types.inputs import UpdateShelterPhotoInput

SHELTER_PHOTO_CONFIG = AttachmentUploadConfig(
    upload_path="shelters",
    service_name="shelter_photo",
    allowed_content_types=DEFAULT_IMAGE_CONTENT_TYPES,
    max_file_size=settings.SHELTER_PHOTO_MAX_FILE_SIZE,
)


def create_presigned_uploads(
    *,
    user: User,
    organization_id: str,
    shelter_id: int | str,
    uploads: Iterable[dict],
) -> AuthorizedPresignedUploadBatch:
    """Generate presigned S3 URLs and upload tokens for shelter photos (Phase 1)."""
    shelter_get(user=user, shelter_id=shelter_id, organization_id=organization_id)
    return generic_create_presigned_uploads(
        user=user,
        uploads=uploads,
        config=SHELTER_PHOTO_CONFIG,
    )


def resolve_uploads(
    *,
    user: User,
    organization_id: str,
    shelter_id: int | str,
    photos: Iterable[dict],
) -> list[ShelterPhoto]:
    """Validate tokens + S3 → create ShelterPhoto rows (Phase 3)."""
    items = validate_upload_batch(user=user, uploads=photos, config=SHELTER_PHOTO_CONFIG)

    shelter = shelter_get(user=user, shelter_id=shelter_id, organization_id=organization_id)
    created: list[ShelterPhoto] = []

    with transaction.atomic():
        for item in items:
            photo_type = ShelterPhotoTypeChoices[item["photo_type"]]

            created.append(
                ShelterPhoto.objects.create(
                    shelter=shelter,
                    file=item["file_path"],
                    type=photo_type,
                )
            )

    return created


@transaction.atomic
def delete_shelter_photos(*, user: "User", organization_id: str, ids: list[int]) -> list[int]:
    """Delete shelter photos scoped to *organization_id*.

    Only photos belonging to shelters in the active organization are
    eligible for deletion.
    """
    org_shelters = shelter_queryset(user=user, organization_id=organization_id)
    photos = ShelterPhoto.objects.filter(
        shelter__in=org_shelters,
        pk__in=ids,
    )
    deleted_ids = list(photos.values_list("pk", flat=True))

    missing = set(ids) - set(deleted_ids)
    if missing:
        raise ObjectDoesNotExist(f"ShelterPhoto IDs not found or not accessible: {sorted(missing)}")

    photos.delete()

    return deleted_ids


def update_shelter_photo(*, user: "User", organization_id: str, data: UpdateShelterPhotoInput) -> ShelterPhoto:
    """Update a shelter photo's type.

    Validates org access via the photo's shelter, scoped to *organization_id*.

    Raises:
        ``ObjectDoesNotExist`` when the photo is not found or the user does not
        belong to its shelter's organization.
    """
    photo_id = data.id

    photo = get_by_pk_or_not_found(
        ShelterPhoto.objects.filter(shelter__in=shelter_queryset(user=user, organization_id=organization_id)),
        pk=photo_id,
    )

    photo.type = data.photo_type
    photo.save(update_fields=["type", "updated_at"])

    return photo

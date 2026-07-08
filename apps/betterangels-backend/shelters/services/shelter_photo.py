from dataclasses import dataclass
from typing import Iterable

from accounts.models import User
from common.constants import DEFAULT_IMAGE_CONTENT_TYPES
from common.services import attachment_upload
from common.services.attachment_upload import (
    AttachmentUploadConfig,
    GenerateUploadItem,
    ResolveUploadItem,
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


# ── Domain-specific types ───────────────────────────────────────────────────


@dataclass(frozen=True)
class ShelterPhotoResolveItem:
    """Typed input for ``resolve_uploads`` — preserves the ``photo_type`` enum.

    GraphQL resolvers receive ``photo_type`` as a ``ShelterPhotoTypeChoices``
    enum member.  If we used ``strawberry.asdict()`` (or a plain Strawberry
    input type) it would serialize the enum to a string, and the service layer
    would have to parse it back — losing type safety and risking ``KeyError``.

    This dataclass keeps the typed enum from schema → service so the service
    never needs to parse strings back into enums.
    """

    presigned_key: str
    upload_token: str
    filename: str
    mime_type: str
    photo_type: ShelterPhotoTypeChoices

    def to_resolve_item(self) -> ResolveUploadItem:
        """Extract the generic fields for ``validate_upload_batch``."""
        return ResolveUploadItem(
            presigned_key=self.presigned_key,
            upload_token=self.upload_token,
            filename=self.filename,
            mime_type=self.mime_type,
        )


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
    uploads: Iterable[GenerateUploadItem],
) -> AuthorizedPresignedUploadBatch:
    """Generate presigned S3 URLs and upload tokens for shelter photos (Phase 1)."""
    shelter_get(user=user, shelter_id=shelter_id, organization_id=organization_id)
    return attachment_upload.create_presigned_uploads(
        user=user,
        uploads=uploads,
        config=SHELTER_PHOTO_CONFIG,
    )


def resolve_uploads(
    *,
    user: User,
    organization_id: str,
    shelter_id: int | str,
    photos: Iterable[ShelterPhotoResolveItem],
) -> list[ShelterPhoto]:
    """Validate tokens + S3 → create ShelterPhoto rows (Phase 3).

    Accepts typed ``ShelterPhotoResolveItem`` instances so that
    ``photo_type`` arrives as a ``ShelterPhotoTypeChoices`` enum member
    — no string parsing, no ``KeyError`` possible.
    """
    photo_list = list(photos)

    # Validate the generic fields through the shared pipeline.
    validated = validate_upload_batch(
        user=user,
        uploads=(p.to_resolve_item() for p in photo_list),
        config=SHELTER_PHOTO_CONFIG,
    )

    shelter = shelter_get(user=user, shelter_id=shelter_id, organization_id=organization_id)
    created: list[ShelterPhoto] = []

    with transaction.atomic():
        for photo, item in zip(photo_list, validated):
            created.append(
                ShelterPhoto.objects.create(
                    shelter=shelter,
                    file=item.file_path,
                    type=photo.photo_type,
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

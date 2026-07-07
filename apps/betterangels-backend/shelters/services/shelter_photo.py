from typing import Iterable

from accounts.models import User
from common.constants import DEFAULT_IMAGE_CONTENT_TYPES
from common.services.s3 import (
    DEFAULT_UPLOAD_EXPIRATION_SECONDS,
    PresignedS3UploadInput,
    generate_s3_presigned_upload_urls,
    s3_key_exists,
    strip_storage_location,
)
from common.services.types import AuthorizedPresignedUpload, AuthorizedPresignedUploadBatch
from common.services.upload_token import create_upload_token, validate_upload_token
from common.utils import get_by_pk_or_not_found
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from shelters.models import ShelterPhoto
from shelters.selectors import shelter_get, shelter_queryset
from shelters.types.inputs import ShelterPhotoFromUploadInput, ShelterPhotoUploadItemInput, UpdateShelterPhotoInput

UPLOAD_PATH = "shelters"
SERVICE_NAME = "shelter_photo"

ALLOWED_CONTENT_TYPES = DEFAULT_IMAGE_CONTENT_TYPES


def _validate_content_type(content_type: str, filename: str) -> None:
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise ValueError(f"Unsupported content_type: {content_type} for filename={filename}.")


def create_presigned_uploads(
    *,
    user: User,
    organization_id: str,
    shelter_id: int | str,
    uploads: Iterable[ShelterPhotoUploadItemInput],
) -> AuthorizedPresignedUploadBatch:
    shelter_get(user=user, shelter_id=shelter_id, organization_id=organization_id)

    mapped_uploads: list[PresignedS3UploadInput] = []

    for upload in uploads:
        _validate_content_type(upload.content_type, upload.filename)

        mapped_uploads.append(
            {
                "ref_id": upload.ref_id,
                "filename": upload.filename,
                "content_type": upload.content_type,
                "upload_path": UPLOAD_PATH,
                "max_file_size": settings.SHELTER_PHOTO_MAX_FILE_SIZE,
            }
        )

    presigned_batch = generate_s3_presigned_upload_urls(uploads=mapped_uploads)

    authorized_uploads: list[AuthorizedPresignedUpload] = []

    for item in presigned_batch["uploads"]:
        upload_token = create_upload_token(
            key=item["key"],
            user_id=user.pk,
            expires_in_seconds=DEFAULT_UPLOAD_EXPIRATION_SECONDS,
            scope=SERVICE_NAME,
        )

        authorized_uploads.append(
            {
                "ref_id": item["ref_id"],
                "url": item["url"],
                "fields": item["fields"],
                "presigned_key": item["key"],
                "upload_token": upload_token,
            }
        )

    return AuthorizedPresignedUploadBatch(uploads=authorized_uploads)


def resolve_uploads(
    *,
    user: User,
    organization_id: str,
    shelter_id: int | str,
    photos: Iterable[ShelterPhotoFromUploadInput],
) -> list[ShelterPhoto]:
    # Validate the entire batch before any DB writes.
    photo_list = list(photos)

    for photo in photo_list:
        _validate_content_type(photo.content_type, photo.filename)

        if not validate_upload_token(
            upload_token=photo.upload_token,
            key=photo.presigned_key,
            user_id=user.pk,
            scope=SERVICE_NAME,
        ):
            raise ValueError(f"Invalid or expired upload token for '{photo.filename}'")

        if not s3_key_exists(key=photo.presigned_key):
            raise ValueError(f"File not found in storage for '{photo.filename}'")

    # Validations passed — persist photos.
    created: list[ShelterPhoto] = []

    shelter = shelter_get(user=user, shelter_id=shelter_id, organization_id=organization_id)

    with transaction.atomic():
        for photo in photo_list:
            file_path = strip_storage_location(photo.presigned_key)

            shelter_photo = ShelterPhoto.objects.create(
                shelter=shelter,
                file=file_path,
                type=photo.photo_type,
            )
            created.append(shelter_photo)

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

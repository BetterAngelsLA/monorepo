"""Media models — photos and videos attached to shelters."""

from typing import Any, Optional

from admin_async_upload.models import AsyncFileField
from common.models import BaseModel
from django.core.exceptions import ValidationError
from django.core.files.storage import default_storage
from django.core.validators import RegexValidator
from django.db import models
from django_choices_field import TextChoicesField
from shelters.enums import MediaLinkTypeChoices, ShelterPhotoTypeChoices

from .shelter import Shelter

ATTACHMENT_MAX_FILENAME_LENGTH = 100
UPLOAD_BASE_DIR = "shelters/"


def upload_path(instance: Optional[Shelter], filename: str) -> str:
    """
    Uses the default storage's get_available_name to generate a unique path
    that does not exceed the field's max_length.

    This defers deduplication logic (suffixing) to the storage backend while
    still respecting length limits.
    """
    file_path = f"{UPLOAD_BASE_DIR}{filename}"

    return default_storage.get_available_name(file_path, max_length=ATTACHMENT_MAX_FILENAME_LENGTH)


class InteriorPhoto(BaseModel):
    file = AsyncFileField(upload_to=upload_path, max_length=ATTACHMENT_MAX_FILENAME_LENGTH)
    shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE, related_name="interior_photos")


class ExteriorPhoto(BaseModel):
    file = AsyncFileField(upload_to=upload_path, max_length=ATTACHMENT_MAX_FILENAME_LENGTH)
    shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE, related_name="exterior_photos")


class ShelterPhoto(BaseModel):
    file = AsyncFileField(upload_to=upload_path, max_length=ATTACHMENT_MAX_FILENAME_LENGTH)
    shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE, related_name="photos")
    type = TextChoicesField(choices_enum=ShelterPhotoTypeChoices)

    class Meta:
        indexes = [models.Index(fields=["shelter", "type"])]


class InteriorShelterPhoto(ShelterPhoto):
    """Proxy for ``ShelterPhoto`` rows whose type is ``INTERIOR``.

    Used by the admin to surface interior photos as their own inline section.
    Saving an instance of this proxy automatically tags it as interior.
    Inline filtering by type happens in the admin via ``get_queryset``.
    """

    class Meta:
        proxy = True
        verbose_name = "Interior Photo"
        verbose_name_plural = "Interior Photos"

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.type = ShelterPhotoTypeChoices.INTERIOR
        super().save(*args, **kwargs)


class ExteriorShelterPhoto(ShelterPhoto):
    """Proxy for ``ShelterPhoto`` rows whose type is ``EXTERIOR``.

    Used by the admin to surface exterior photos as their own inline section.
    Saving an instance of this proxy automatically tags it as exterior.
    Inline filtering by type happens in the admin via ``get_queryset``.
    """

    class Meta:
        proxy = True
        verbose_name = "Exterior Photo"
        verbose_name_plural = "Exterior Photos"

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.type = ShelterPhotoTypeChoices.EXTERIOR
        super().save(*args, **kwargs)


class Video(BaseModel):
    file = AsyncFileField(upload_to=upload_path, max_length=ATTACHMENT_MAX_FILENAME_LENGTH)
    shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE, related_name="videos")


YOUTUBE_URL_VALIDATOR = RegexValidator(
    regex=r"(?:youtube\.com/(?:watch\?.*v=|embed/|shorts/)|youtu\.be/)[\w-]{11}",
    message="Enter a valid YouTube URL.",
)

MEDIA_TYPE_VALIDATORS: dict[str, RegexValidator] = {
    MediaLinkTypeChoices.YOUTUBE: YOUTUBE_URL_VALIDATOR,
}


class MediaLink(BaseModel):
    url = models.URLField(max_length=255)
    title = models.CharField(max_length=255, blank=True)
    media_type = TextChoicesField(
        choices_enum=MediaLinkTypeChoices,
        default=MediaLinkTypeChoices.YOUTUBE,
    )
    shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE, related_name="media_links")

    def clean(self) -> None:
        super().clean()
        validator = MEDIA_TYPE_VALIDATORS.get(self.media_type)
        if validator:
            try:
                validator(self.url)
            except ValidationError:
                raise ValidationError({"url": validator.message})

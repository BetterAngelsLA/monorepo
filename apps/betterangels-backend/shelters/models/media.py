"""Media models — photos and videos attached to shelters."""

from typing import Optional

from admin_async_upload.models import AsyncFileField
from common.models import BaseModel
from django.core.exceptions import ValidationError
from django.core.files.storage import default_storage
from django.core.validators import RegexValidator
from django.db import models
from django_choices_field import TextChoicesField
from shelters.enums import MediaLinkTypeChoices

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

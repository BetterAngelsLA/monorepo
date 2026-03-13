"""Media models — photos and videos attached to shelters."""

from typing import Optional

from admin_async_upload.models import AsyncFileField
from common.models import BaseModel
from django.core.files.storage import default_storage
from django.db import models

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

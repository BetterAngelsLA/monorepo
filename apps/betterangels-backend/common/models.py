from typing import Any

import magic
from accounts.models import User
from common.enums import FileType
from common.utils import get_unique_file_path
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.contrib.gis.db.models import PointField
from django.db import models
from django.db.models import ForeignKey
from django_choices_field import TextChoicesField
from guardian.models import GroupObjectPermissionBase, UserObjectPermissionBase


class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Attachment(BaseModel):
    """
    Represents an attachment linked to any model instance within the app.
    Attachments are organized by namespaces to allow for application-specific
    categorization and by file types for easier management and filtering.


    Attributes:
        file: Stores the file with a unique path.
        file_type: Enumerated type categorizing the file (e.g., IMAGE, AUDIO).
        original_filename: The original name of the file as uploaded.
        content_type: Links to the ContentType for polymorphic relations.
        object_id: The ID of the associated model instance.
        content_object: Generic relation to the associated model instance.
        namespace: Optional field for further categorization within specific contexts.
        uploaded_by: Reference to the User who uploaded the file.
        associated_with: The User with whom the attachment is associated, if any.
    """

    file = models.FileField(upload_to=get_unique_file_path)
    file_type = TextChoicesField(choices_enum=FileType)
    original_filename = models.CharField(max_length=255, blank=True, null=True)

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")

    namespace = models.CharField(max_length=255, blank=True, null=True)

    uploaded_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="uploaded_attachments"
    )
    associated_with = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="associated_attachments",
    )

    attachmentuserobjectpermission_set: models.QuerySet["Attachment"]
    attachmentgroupobjectpermission_set: models.QuerySet["Attachment"]

    class Meta:
        indexes = [
            models.Index(
                fields=[
                    "object_id",
                    "content_type_id",
                    "namespace",
                    "file_type",
                ],
                name="attachment_comp_idx",
            )
        ]

    def save(self, *args: Any, **kwargs: Any) -> None:
        """
        Saves the Attachment instance. If it's a new instance (without an ID),
        it stores the original file name and determines the file type based on
        MIME type analysis. This method enhances file handling by preserving
        the original file name and categorizing the file for easier management.
        """
        if not self.pk:
            self.original_filename = self.file.name

            # Determine the MIME type of the file
            mime_type = magic.from_buffer(self.file.read(1024), mime=True)
            # Map MIME type to FileType enum
            if mime_type.startswith("image"):
                self.file_type = FileType.IMAGE
            elif mime_type.startswith("audio"):
                self.file_type = FileType.AUDIO
            elif mime_type.startswith("video"):
                self.file_type = FileType.VIDEO
            else:
                self.file_type = FileType.DOCUMENT
            self.file.seek(0)
        super().save(*args, **kwargs)


class Location(BaseModel):
    point = PointField(geography=True)
    address = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    zip_code = models.CharField(max_length=50, blank=True)


# Permissions
class AttachmentUserObjectPermission(UserObjectPermissionBase):
    content_object: ForeignKey = models.ForeignKey(
        Attachment,
        on_delete=models.CASCADE,
    )


class AttachmentGroupObjectPermission(GroupObjectPermissionBase):
    content_object: ForeignKey = models.ForeignKey(
        Attachment,
        on_delete=models.CASCADE,
    )

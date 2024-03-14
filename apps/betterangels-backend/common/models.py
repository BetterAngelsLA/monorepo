from typing import Any

import black
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
    id = models.BigAutoField(editable=False, unique=True, primary_key=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class SimpleModel(models.Model):
    name = models.CharField(max_length=255)
    objects = models.Manager()

    simplemodeluserobjectpermission_set: models.QuerySet["SimpleModel"]
    simplemodelgroupobjectpermission_set: models.QuerySet["SimpleModel"]


class Attachment(BaseModel):
    """
    Represents an attachment linked to any model instance within the app.

    This model is flexible, allowing linkage to various content types and their
    specific object instances. It includes a mechanism for categorizing
    attachments within specific namespaces for finer-grained organization.

    Attributes:
        file (models.FileField): The associated file, stored with a unique path.
        file_type (TextChoicesField): Categorizes the attachment by file type.
        content_type (ForeignKey): Refers to ContentType for polymorphic association.
        object_id (PositiveIntegerField): ID of the model instance linked to.
        content_object (GenericForeignKey): Creates a generic relation to a model.
        namespace (CharField): Categorizes attachments within broader contexts or
            application-specific domains, useful for differentiating attachments
            within the same model type.
    """

    file = models.FileField(upload_to=get_unique_file_path)
    file_type = TextChoicesField(choices_enum=FileType)

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")

    namespace = models.CharField(max_length=255, blank=True, null=True)

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
        When a new Attachment instance is being saved for the first time (i.e., it does
        not have an ID yet), this method captures and stores the original name of the
        file in the `original_filename` field. This is essential for maintaining a
        reference to the original file name as uploaded by the user, which can be useful
        for display purposes or when you need to reference the original file format.

        Args:
            *args: Variable length argument list.
            **kwargs: Arbitrary keyword arguments.

        Returns:
            None
        """
        if not self.id:
            self.original_filename = self.file.name
        super().save(*args, **kwargs)


class Location(BaseModel):
    point = PointField(geography=True)
    address = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    zip_code = models.CharField(max_length=50, blank=True)


# Permissions


class SimpleModelUserObjectPermission(UserObjectPermissionBase):
    content_object: ForeignKey = models.ForeignKey(
        SimpleModel, on_delete=models.CASCADE
    )


class SimpleModelGroupObjectPermission(GroupObjectPermissionBase):
    content_object: ForeignKey = models.ForeignKey(
        SimpleModel, on_delete=models.CASCADE
    )

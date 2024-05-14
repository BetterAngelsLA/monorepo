import json
from typing import Any, Dict, Optional

from accounts.models import User
from common.enums import AttachmentType
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
        attachment_type: Enumerated type categorizing the file (e.g., IMAGE, AUDIO).
        original_filename: The original name of the file as uploaded.
        content_type: Links to the ContentType for polymorphic relations.
        object_id: The ID of the associated model instance.
        content_object: Generic relation to the associated model instance.
        namespace: Optional field for further categorization within specific contexts.
        uploaded_by: Reference to the User who uploaded the file.
        associated_with: The User with whom the attachment is associated, if any.
    """

    file = models.FileField(upload_to=get_unique_file_path)
    attachment_type = TextChoicesField(choices_enum=AttachmentType)
    original_filename = models.CharField(max_length=255, blank=True, null=True)

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")

    namespace = models.CharField(max_length=255, blank=True, null=True)

    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="uploaded_attachments")
    associated_with = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="associated_attachments",
    )

    attachmentuserobjectpermission_set: models.QuerySet["AttachmentUserObjectPermission"]
    attachmentgroupobjectpermission_set: models.QuerySet["AttachmentGroupObjectPermission"]

    def __str__(self) -> str:
        return f"{self.content_object} {self.object_id} - " f"{self.attachment_type} - {self.original_filename}"

    class Meta:
        indexes = [
            models.Index(
                fields=[
                    "object_id",
                    "content_type_id",
                    "namespace",
                    "attachment_type",
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
            mime_type = self.file.file.content_type
            # Map MIME type to AttachmentType enum
            if mime_type.startswith("image"):
                self.attachment_type = AttachmentType.IMAGE
            elif mime_type.startswith("audio"):
                self.attachment_type = AttachmentType.AUDIO
            elif mime_type.startswith("video"):
                self.attachment_type = AttachmentType.VIDEO
            else:
                self.attachment_type = AttachmentType.DOCUMENT
            self.file.seek(0)
        super().save(*args, **kwargs)


class Address(BaseModel):
    street = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    zip_code = models.CharField(max_length=10, blank=True, null=True)

    address_components = models.JSONField(blank=True, null=True)
    formatted_address = models.CharField(max_length=255, blank=True, null=True)

    objects = models.Manager()

    class Meta(BaseModel.Meta):
        indexes = [
            models.Index(
                fields=[
                    "street",
                    "city",
                    "state",
                    "zip_code",
                    "address_components",
                    "formatted_address",
                ],
                name="address_index",
            )
        ]

    def __str__(self) -> str:
        return f"{self.street}, {self.city}, {self.state}, {self.zip_code}"


class Location(BaseModel):
    address = models.ForeignKey(Address, on_delete=models.SET_NULL, null=True, blank=True)
    point = PointField(geography=True, null=True, blank=True)
    point_of_interest = models.CharField(max_length=255, blank=True, null=True)

    objects = models.Manager()

    @staticmethod
    def parse_address_components(address_components: str) -> dict:
        address_fields = {
            "street_number": "long_name",  # House/building number
            "route": "long_name",  # Street name
            "locality": "long_name",  # City
            "administrative_area_level_1": "short_name",  # State
            "country": "long_name",
            "postal_code": "long_name",
            "point_of_interest": "long_name",
        }

        components = json.loads(address_components)
        parsed_address = {
            field: next((component.get(name_type) for component in components if field in component["types"]), None)
            for field, name_type in address_fields.items()
        }

        return parsed_address

    @classmethod
    def get_or_create_address(cls, address_data: Dict[str, Any]) -> "Address":
        """Gets or creates an address and returns it."""
        # This function expects a Google Geocoding API payload
        # https://developers.google.com/maps/documentation/geocoding/requests-geocoding
        parsed_address = cls.parse_address_components(address_data["address_components"])

        street_number = parsed_address.get("street_number")
        route = parsed_address.get("route")
        street = f"{street_number} {route}".strip() if street_number and route else route
        address, _ = Address.objects.get_or_create(
            street=street,
            city=parsed_address.get("locality"),
            state=parsed_address.get("administrative_area_level_1"),
            zip_code=parsed_address.get("postal_code"),
            address_components=address_data["address_components"],
            formatted_address=address_data["formatted_address"],
        )

        return address

    @classmethod
    def get_point_of_interest(cls, address_data: Dict[str, Any]) -> Optional[str]:
        components: list[Dict[str, str]] = json.loads(address_data["address_components"])

        return next(
            (component["long_name"] for component in components if "point_of_interest" in component["types"]), None
        )

    @classmethod
    def get_or_create_location(cls, location_data: Dict[str, Any]) -> "Location":
        """Gets or creates an location and returns it."""
        # This function expects a Google Geocoding API payload
        # https://developers.google.com/maps/documentation/geocoding/requests-geocoding

        address = Location.get_or_create_address(location_data["address"])
        point_of_interest = location_data["point_of_interest"] or cls.get_point_of_interest(location_data["address"])

        location, _ = Location.objects.get_or_create(
            address=address,
            point=location_data["point"],
            point_of_interest=point_of_interest,
        )

        return location


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

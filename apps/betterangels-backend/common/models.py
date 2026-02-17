import json
from typing import Any, Dict, Optional
from urllib.parse import unquote

import magic
from common.enums import AttachmentType
from common.utils import canonicalise_filename, get_unique_file_path
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.contrib.gis.db.models import PointField
from django.contrib.gis.geos import Point
from django.db import models
from django.db.models import ForeignKey
from django.db.models.functions import Lower
from django_choices_field import TextChoicesField
from guardian.models import GroupObjectPermissionBase, UserObjectPermissionBase
from phonenumber_field.modelfields import PhoneNumberField


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
    """

    file = models.FileField(upload_to=get_unique_file_path)
    attachment_type = TextChoicesField(choices_enum=AttachmentType)
    mime_type = models.CharField()
    original_filename = models.CharField(max_length=255, blank=True, null=True)

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")

    namespace = models.CharField(max_length=255, blank=True, null=True)

    uploaded_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, related_name="uploaded_attachments"
    )

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
            # Determine the MIME type of the file
            self.file.seek(0)
            mime_type = self.file.file.content_type or magic.from_buffer(self.file.read(), mime=True)
            self.mime_type = mime_type
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

        filename = self.original_filename or unquote(self.file.name)
        self.original_filename = canonicalise_filename(self.mime_type, filename)

        super().save(*args, **kwargs)


class Address(BaseModel):
    street = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    zip_code = models.CharField(max_length=10, blank=True, null=True)
    confidential = models.BooleanField(null=True, blank=True)

    address_components = models.JSONField(blank=True, null=True)
    formatted_address = models.CharField(max_length=255, blank=True, null=True)

    objects = models.Manager()

    class Meta(BaseModel.Meta):
        indexes = [
            models.Index(
                Lower("street"),
                Lower("city"),
                Lower("state"),
                Lower("zip_code"),
                name="address_lookup_idx",
            )
        ]

    ADDRESS_DEFAULT = "No Address"

    def __str__(self) -> str:
        if self.street and self.city and self.state and self.zip_code:
            return f"{self.street}, {self.city}, {self.state}, {self.zip_code}"
        elif self.formatted_address:
            return self.formatted_address

        return self.ADDRESS_DEFAULT


class Location(BaseModel):
    # 5 decimal places ≈ 1.1 m — filters mobile GPS jitter while
    # preserving individual-building precision.
    GPS_PRECISION = 5

    address = models.ForeignKey(Address, on_delete=models.SET_NULL, null=True, blank=True)
    point = PointField(geography=True)
    point_of_interest = models.CharField(max_length=255, blank=True, null=True)

    objects = models.Manager()

    def __str__(self) -> str:
        if self.address and str(self.address) != Address.ADDRESS_DEFAULT:
            return str(self.address)

        return str(self.point.coords)

    @staticmethod
    def _get_component_value(component: dict, name_type: str) -> Optional[str]:
        """Read a value from an address component, supporting both v1 and legacy formats.

        v1 format uses longText/shortText; legacy format uses long_name/short_name.
        """
        if name_type == "long_name":
            return component.get("longText") or component.get("long_name")
        elif name_type == "short_name":
            return component.get("shortText") or component.get("short_name")
        return None

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
            field: next(
                (
                    Location._get_component_value(component, name_type)
                    for component in components
                    if field in component.get("types", [])
                ),
                None,
            )
            for field, name_type in address_fields.items()
        }

        return parsed_address

    @staticmethod
    def _clean(value: Optional[str]) -> Optional[str]:
        """Strip leading/trailing whitespace and collapse internal runs.

        Returns None for blank/empty strings.
        """
        if value is None:
            return None
        value = " ".join(value.split()).strip()
        return value or None

    @staticmethod
    def _round_point(point: Point) -> Point:
        """Round a Point's coordinates to GPS_PRECISION decimal places.

        Eliminates sub-metre GPS jitter so that nearby pin-drops resolve
        to the same Location row instead of creating duplicates.
        """
        p = Location.GPS_PRECISION
        return Point(round(point.x, p), round(point.y, p), srid=point.srid)

    @classmethod
    def get_or_create_address(cls, address_data: Dict[str, Any]) -> "Address":
        """Gets or creates an address and returns it.

        Uses case-insensitive lookups so that 'Los Angeles' and 'los angeles'
        resolve to the same row.  The functional Lower() index on Address
        makes these queries fast.

        When ``address_components`` is absent (e.g. during an update where the
        client only sends ``formattedAddress``), falls back to a
        ``formatted_address`` lookup so that we re-use the existing Address row
        instead of creating a new one with all-null fields.
        """
        raw_components = address_data.get("address_components")
        formatted = address_data.get("formatted_address") or address_data.get("formattedAddress")

        # Fast path: no address_components → look up by formatted_address
        if not raw_components:
            if formatted:
                address = Address.objects.filter(formatted_address__iexact=formatted).first()
                if address:
                    return address
            # Nothing to match on — create a minimal record
            address, _ = Address.objects.get_or_create(
                formatted_address=formatted or "",
                street__isnull=True,
                city__isnull=True,
                state__isnull=True,
                zip_code__isnull=True,
                defaults={"formatted_address": formatted or ""},
            )
            return address

        parsed_address = cls.parse_address_components(raw_components)

        street_number = parsed_address.get("street_number")
        route = parsed_address.get("route")
        street = cls._clean(f"{street_number} {route}".strip() if street_number and route else route)
        city = cls._clean(parsed_address.get("locality"))
        state = cls._clean(parsed_address.get("administrative_area_level_1"))
        zip_code = cls._clean(parsed_address.get("postal_code"))

        fields = {"street": street, "city": city, "state": state, "zip_code": zip_code}
        lookup = {
            (f"{f}__isnull" if v is None else f"{f}__iexact"): (True if v is None else v) for f, v in fields.items()
        }

        address, _ = Address.objects.get_or_create(
            **lookup,
            defaults={
                **fields,
                "address_components": raw_components,
                "formatted_address": formatted,
            },
        )

        return address

    @classmethod
    def get_point_of_interest(cls, address_data: Dict[str, Any]) -> Optional[str]:
        raw = address_data.get("address_components")
        if not raw:
            return None
        components: list[Dict[str, str]] = json.loads(raw)

        return next(
            (
                Location._get_component_value(component, "long_name")
                for component in components
                if "point_of_interest" in component.get("types", [])
            ),
            None,
        )

    @classmethod
    def get_or_create_location(cls, location_data: Dict[str, Any]) -> "Location":
        """Gets or creates a location and returns it."""
        point = cls._round_point(location_data["point"])

        address_data = location_data.get("address")
        address = Location.get_or_create_address(address_data) if address_data else None
        point_of_interest = location_data.get("point_of_interest") or (
            cls.get_point_of_interest(address_data) if address_data else None
        )

        location, _ = Location.objects.get_or_create(
            point=point,
            defaults={
                "address": address,
                "point_of_interest": point_of_interest,
            },
        )

        return location


class PhoneNumber(models.Model):
    number = PhoneNumberField(region="US", blank=True, null=True)
    is_primary = models.BooleanField(default=False)

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object: GenericForeignKey = GenericForeignKey("content_type", "object_id")

    objects = models.Manager()

    class Meta:
        indexes = [
            models.Index(
                fields=[
                    "object_id",
                    "content_type_id",
                ],
                name="phonenumber_comp_idx",
            )
        ]

    def save(self, *args: Any, **kwargs: Any) -> None:
        if self.is_primary:
            PhoneNumber.objects.filter(
                content_type=self.content_type, object_id=self.object_id, is_primary=True
            ).update(is_primary=False)

        super().save(*args, **kwargs)


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

# apps/betterangels-backend/common/models.py

import json
from typing import Any, Dict, Optional
from urllib.parse import unquote

import magic
from common.enums import AttachmentType
from common.files.utils import canonicalise_filename, get_unique_file_path, infer_attachment_type
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
            self.attachment_type = infer_attachment_type(self.mime_type)
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
        constraints = [
            models.UniqueConstraint(
                Lower("formatted_address"),
                condition=models.Q(formatted_address__isnull=False),
                name="unique_formatted_address",
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
    def get_or_create_address(cls, address_data: Dict[str, Any]) -> Optional["Address"]:
        """Get or create an Address, deduplicating by formatted_address.

        ``formatted_address`` is the canonical unique key (case-insensitive).
        Address components (street, city, state, zip) are parsed from
        ``address_components`` when present and stored on the row as metadata
        during initial creation; they are never used as lookup keys.

        When neither ``formatted_address`` nor ``address_components`` is
        provided, returns ``None``.
        """
        raw_components = address_data.get("address_components")
        formatted = address_data.get("formatted_address") or address_data.get("formattedAddress")

        if not raw_components and not formatted:
            return None

        # Parse component fields when available (used as defaults on creation)
        street = city = state = zip_code = None
        if raw_components:
            parsed = cls.parse_address_components(raw_components)
            street_number = parsed.get("street_number")
            route = parsed.get("route")
            street = cls._clean(f"{street_number} {route}".strip() if street_number and route else route)
            city = cls._clean(parsed.get("locality"))
            state = cls._clean(parsed.get("administrative_area_level_1"))
            zip_code = cls._clean(parsed.get("postal_code"))

        # Primary dedup path: formatted_address (unique constraint)
        if formatted:
            address, _ = Address.objects.get_or_create(
                formatted_address__iexact=formatted,
                defaults={
                    "formatted_address": formatted,
                    "street": street,
                    "city": city,
                    "state": state,
                    "zip_code": zip_code,
                },
            )
            return address

        # Fallback: components present but no formatted_address
        fields = {"street": street, "city": city, "state": state, "zip_code": zip_code}
        lookup = {
            (f"{f}__isnull" if v is None else f"{f}__iexact"): (True if v is None else v) for f, v in fields.items()
        }
        address, _ = Address.objects.get_or_create(
            **lookup,
            defaults=fields,
        )
        return address

    @classmethod
    def get_point_of_interest(cls, address_data: Dict[str, Any]) -> Optional[str]:
        raw = address_data.get("address_components")
        if not raw:
            return None
        return cls.parse_address_components(raw).get("point_of_interest")

    @classmethod
    def get_or_create_location(cls, location_data: Dict[str, Any]) -> "Location":
        """Return an existing Location or create a new one.

        Deduplication is based on the triple (point, address, point_of_interest).
        If all three match an existing row, that row is reused — no data is
        overwritten.  Otherwise a new Location is created.
        """
        point = cls._round_point(location_data["point"])

        address_data = location_data.get("address")
        address = Location.get_or_create_address(address_data) if address_data else None

        poi = location_data.get("point_of_interest")
        if poi is None and address_data:
            poi = cls.get_point_of_interest(address_data)

        location, _ = Location.objects.get_or_create(
            point=point,
            address=address,
            point_of_interest=poi,
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

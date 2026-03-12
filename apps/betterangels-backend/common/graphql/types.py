import re
from datetime import datetime
from typing import Any, Mapping, NewType, Optional, cast

import strawberry
import strawberry_django
from common.constants import PHONE_NUMBER_REGEX
from common.enums import ImagePresetEnum
from common.imgproxy import (
    build_imgproxy_url,
    get_image_source_url,
    is_imgproxy_enabled,
    resolve_imgproxy_ops,
)
from common.models import Address, Attachment, Location, PhoneNumber
from django.db.models import Q
from phonenumber_field.modelfields import PhoneNumber as DjangoPhoneNumber
from phonenumber_field.phonenumber import PhoneNumber as DjangoPhoneNumberUtil
from strawberry import ID, Info, auto
from strawberry.types.field import StrawberryField
from strawberry.types.scalar import ScalarDefinition


def make_in_filter(field_name: str, value_type: Any) -> StrawberryField:
    @strawberry_django.filter_field
    def _filter(info: Info, value: Optional[list[value_type]], prefix: str) -> Q:
        if not value:
            return Q()

        normalized_value = [value_type[v.name] if not isinstance(v, str) else v for v in value]

        return Q(**{f"{prefix}{field_name}__in": normalized_value})

    return _filter


def _parse_latitude(v: float) -> float:
    if abs(v) > 90:
        raise ValueError("Latitude value must be between -90.0 and 90.0")

    return v


def _parse_longitude(v: float) -> float:
    if abs(v) > 180:
        raise ValueError("Longitude value must be between -180.0 and 180.0")

    return v


def _parse_phone_number(v: str) -> DjangoPhoneNumber:
    if re.match(PHONE_NUMBER_REGEX, v):
        return DjangoPhoneNumberUtil.from_string(v)

    return v


def _serialize_phone_number(v: DjangoPhoneNumber) -> str:
    if v.extension:
        return f"{v.national_number}x{v.extension}"

    return str(v.national_number)


def _parse_non_blank_string(v: str) -> Optional[str]:
    """Coerces blank input to None. Use for optional string fields where blank means 'no value'."""
    return v.strip() if v and v.strip() else None


def _parse_non_empty_string(v: str) -> str:
    """Rejects blank input. Use for required string fields."""
    if not v or not v.strip():
        raise ValueError("Value cannot be blank.")

    return v.strip()


# Custom scalar types
LatitudeScalar = NewType("LatitudeScalar", float)
LongitudeScalar = NewType("LongitudeScalar", float)
NonBlankString = NewType("NonBlankString", str)
NonEmptyString = NewType("NonEmptyString", str)
PhoneNumberScalar = NewType("PhoneNumberScalar", str)

# Scalar configurations for StrawberryConfig.scalar_map
SCALAR_MAP: Mapping[object, ScalarDefinition] = {
    LatitudeScalar: strawberry.scalar(
        name="LatitudeScalar",
        serialize=lambda v: v,
        parse_value=_parse_latitude,
    ),
    LongitudeScalar: strawberry.scalar(
        name="LongitudeScalar",
        serialize=lambda v: v,
        parse_value=_parse_longitude,
    ),
    NonBlankString: strawberry.scalar(
        name="NonBlankString",
        description="Coerces blank input to None. Use for optional string fields where blank means 'no value'.",
        serialize=lambda v: v,
        parse_value=_parse_non_blank_string,
    ),
    NonEmptyString: strawberry.scalar(
        name="NonEmptyString",
        description="Rejects blank input. Use for required string fields.",
        serialize=lambda v: v,
        parse_value=_parse_non_empty_string,
    ),
    PhoneNumberScalar: strawberry.scalar(
        name="PhoneNumber",
        serialize=lambda v: _serialize_phone_number(v) if isinstance(v, DjangoPhoneNumber) else "",
        parse_value=lambda v: _parse_phone_number(v.strip()) if v and v.strip() else None,
    ),
}


@strawberry_django.type(PhoneNumber)
class PhoneNumberType:
    id: ID
    number: Optional[PhoneNumberScalar]
    is_primary: Optional[bool]


@strawberry_django.input(PhoneNumber)
class PhoneNumberInput:
    id: Optional[ID]
    number: Optional[PhoneNumberScalar]
    is_primary: Optional[bool] = False


@strawberry.input
class DeleteDjangoObjectInput:
    id: strawberry.ID


@strawberry_django.type(Address)
class AddressType:
    id: ID
    street: auto
    city: auto
    state: auto
    zip_code: auto


@strawberry.input
class AddressInput:
    address_components: Optional[strawberry.scalars.JSON] = None
    formatted_address: Optional[str] = None


@strawberry.type(name="DjangoImageType")
class BaImageType:
    """GraphQL type for Django ``ImageField`` values.

    Attributes exposed from the underlying ``FieldFile``:
        name, path, size, width, height

    The ``url`` field accepts an optional ``preset`` for named sizes
    or a raw ``processing`` string for full imgproxy control.
    When imgproxy is enabled and either is supplied, the returned URL
    points to the imgproxy-processed variant.  Otherwise the normal
    (CloudFront-signed) storage URL is returned.
    """

    name: str
    path: str = ""
    size: int = 0
    width: int = 0
    height: int = 0

    @strawberry.field
    def url(
        self,
        preset: Optional[ImagePresetEnum] = None,
        processing: Optional[str] = None,
    ) -> str:
        """Return the image URL, optionally processed by imgproxy.

        Args:
            preset: A named size preset (SM, MD, LG).  Ignored when
                ``processing`` is also provided.
            processing: A raw imgproxy options string such as
                ``"rs:fill:200:200"`` or ``"rs:fit:800:600/q:80"``.
                Takes precedence over ``preset``.
        """
        ops = resolve_imgproxy_ops(preset, processing)

        if ops and is_imgproxy_enabled():
            source = get_image_source_url(self)
            storage = getattr(self, "storage", None)

            if source:
                imgproxy_url = build_imgproxy_url(source, ops, storage=storage)
                if imgproxy_url:
                    return imgproxy_url

        return cast(str, self.url)


@strawberry_django.type(Location)
class LocationType:
    id: Optional[ID]
    address: AddressType
    point: auto
    point_of_interest: auto


@strawberry_django.input(Location)
class LocationInput:
    address: Optional[AddressInput]
    point: auto
    point_of_interest: auto


@strawberry_django.type(Attachment, is_interface=True)
class AttachmentInterface:
    id: ID
    file: auto
    attachment_type: auto
    mime_type: auto
    original_filename: auto
    created_at: auto
    updated_at: auto


@strawberry.type
class FlagType:
    name: str
    is_active: Optional[bool]
    last_modified: Optional[datetime] = None


@strawberry.type
class SwitchType:
    name: str
    is_active: bool
    last_modified: Optional[datetime] = None


@strawberry.type
class SampleType:
    name: str
    is_active: bool
    last_modified: Optional[datetime] = None


@strawberry.type
class FeatureControlData:
    flags: list[FlagType]
    switches: list[SwitchType]
    samples: list[SampleType]


@strawberry.type
class DeletedObjectType:
    id: int

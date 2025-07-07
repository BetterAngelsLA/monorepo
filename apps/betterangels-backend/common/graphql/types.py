import re
from datetime import datetime
from typing import NewType, Optional

import strawberry
import strawberry_django
from common.constants import PHONE_NUMBER_REGEX
from common.models import Address, Attachment, Location, PhoneNumber
from phonenumber_field.modelfields import PhoneNumber as DjangoPhoneNumber
from phonenumber_field.phonenumber import PhoneNumber as DjangoPhoneNumberUtil
from strawberry import ID, auto


def _parse_latitude(v: float) -> float:
    if abs(v) > 90:
        raise ValueError("Latitude value must be between -90.0 and 90.0")

    return v


def _parse_longitude(v: float) -> float:
    if abs(v) > 180:
        raise ValueError("Longitude value must be between -180.0 and 180.0")

    return v


LatitudeScalar = strawberry.scalar(
    NewType("LatitudeScalar", float),
    serialize=lambda v: v,
    parse_value=lambda v: _parse_latitude(v),
)

LongitudeScalar = strawberry.scalar(
    NewType("LongitudeScalar", float),
    serialize=lambda v: v,
    parse_value=lambda v: _parse_longitude(v),
)


def _parse_phone_number(v: str) -> DjangoPhoneNumber:
    if re.match(PHONE_NUMBER_REGEX, v):
        return DjangoPhoneNumberUtil.from_string(v)

    return v

def _serialize_phone_number(v: DjangoPhoneNumber) -> str:
    if v.extension:
        return f"{v.national_number}x{v.extension}"

    return str(v.national_number)


PhoneNumberScalar: DjangoPhoneNumber | str = strawberry.scalar(
    DjangoPhoneNumber,
    parse_value=lambda v: _parse_phone_number(v.strip()) if v.strip() else None,
    serialize=lambda v: _serialize_phone_number(v) if isinstance(v, DjangoPhoneNumber) else '',
)

NonBlankString = strawberry.scalar(
    NewType("NonBlankString", str),
    serialize=lambda v: v,
    parse_value=lambda v: v.strip() if v.strip() else None,
)


@strawberry_django.type(PhoneNumber)
class PhoneNumberType:
    id: ID
    number: Optional[PhoneNumberScalar]  # type: ignore
    is_primary: Optional[bool]


@strawberry_django.input(PhoneNumber)
class PhoneNumberInput:
    id: Optional[ID]
    number: Optional[PhoneNumberScalar]  # type: ignore
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


@strawberry_django.input(Address)
class AddressInput:
    address_components: auto
    formatted_address: auto


@strawberry_django.type(Location)
class LocationType:
    id: ID
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

    # @strawberry.field
    # def thumbnail(
    #     self, params: ThumbNailTransformEnum
    # ) -> Optional[ThumbnailType]:
    #     # Example for future dynamic thumbnail transformation
    #     pass


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

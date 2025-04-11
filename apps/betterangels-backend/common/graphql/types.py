from datetime import datetime
from typing import NewType, Optional

import strawberry
import strawberry_django
from common.models import Address, Attachment, Location, PhoneNumber
from django.contrib.gis.geos import LinearRing, Polygon
from phonenumber_field.modelfields import PhoneNumber as DjangoPhoneNumber
from strawberry import ID, auto

PhoneNumberScalar: DjangoPhoneNumber | str = strawberry.scalar(
    DjangoPhoneNumber,
    serialize=lambda v: str(v.national_number),
    parse_value=lambda v: str(v.strip()) if v.strip() else None,
)

# PolygonScalar = strawberry.scalar(
#     NewType("PolygonScalar", tuple[tuple[float, float], ...]),
#     serialize=lambda v: v.tuple if isinstance(v, Polygon) else v,
#     parse_value=lambda v: Polygon(*[LinearRing(x) for x in v]),
#     description="A geographical object that gets 1 or 2 LinearRing objects as external and internal rings.",
# )

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

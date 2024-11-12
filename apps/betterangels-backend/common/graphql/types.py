from datetime import datetime
from typing import Optional, Union

import strawberry
import strawberry_django
from common.models import Address, Attachment, Location, PhoneNumber
from phonenumber_field.modelfields import PhoneNumber as DjangoPhoneNumber
from phonenumbers import parse
from strawberry import ID, Info, auto

PhoneNumberScalar: Union[DjangoPhoneNumber, str] = strawberry.scalar(
    DjangoPhoneNumber,
    serialize=lambda v: str(v.as_e164),
)


@strawberry.input
class PhoneNumberNumberInput:
    phone_number: str
    region: Optional[str]


@strawberry_django.type(PhoneNumber)
class PhoneNumberType:
    id: ID
    is_primary: Optional[bool]
    number: Optional[PhoneNumberScalar]  # type: ignore


@strawberry_django.input(PhoneNumber)
class PhoneNumberInput:
    id: Optional[ID]
    number: Optional[PhoneNumberNumberInput]  # type: ignore
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

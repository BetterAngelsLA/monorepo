from datetime import datetime
from typing import Any, Optional, Union

import strawberry
import strawberry_django
from common.models import Address, Attachment, Location, PhoneNumber
from phonenumber_field.modelfields import PhoneNumber as DjangoPhoneNumber
from phonenumbers import NumberParseException
from phonenumbers import PhoneNumber as PhoneNumberUS
from phonenumbers import is_valid_number, parse
from strawberry import ID, auto
from strawberry.exceptions import GraphQLError

PhoneNumberScalar: Union[DjangoPhoneNumber, str] = strawberry.scalar(
    DjangoPhoneNumber,
    serialize=lambda v: str(v.national_number),
    parse_value=lambda v: (validate_phone_number(v)),  # Call a validation function here
)


def validate_phone_number(v: Any) -> PhoneNumberUS:
    if not isinstance(v, str):
        raise GraphQLError("The phone number must be a string.")
    try:
        phone_number = parse(v, "US")
        if not is_valid_number(phone_number):
            raise GraphQLError(extensions={"message": "The phone number is not a valid US number."}, message="")
        return phone_number
    except NumberParseException as e:
        raise GraphQLError(f"Invalid phone number format: {str(e)}")


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

from typing import List, cast

import strawberry
import strawberry_django
from common.graphql.types import AddressInput, AddressType
from common.models import Address
from common.permissions.enums import AddressPermissions
from common.utils import convert_to_structured_address
from django.db import transaction
from strawberry.types import Info
from strawberry_django.permissions import HasPerm


@strawberry.type
class Query:
    address: AddressType = strawberry_django.field(
        extensions=[HasPerm(AddressPermissions.VIEW)],
    )

    addresses: List[AddressType] = strawberry_django.field(
        extensions=[HasPerm(AddressPermissions.VIEW)],
    )


@strawberry.type
class Mutation:
    @strawberry_django.mutation(extensions=[HasPerm(AddressPermissions.ADD)])
    def get_or_create_address(self, info: Info, data: AddressInput) -> AddressType:
        with transaction.atomic():
            structured_address = convert_to_structured_address(data.address_components)

            street_number = structured_address.get("street_number")
            route = structured_address.get("route")
            street = (
                f"{street_number} {route}".strip() if street_number and route else route
            )

            address, _ = Address.objects.get_or_create(
                street=street,
                city=structured_address.get("locality"),
                state=structured_address.get("administrative_area_level_1"),
                zip_code=structured_address.get("postal_code"),
                address_components=data.address_components,
                formatted_address=data.formatted_address,
            )

            return cast(AddressType, address)

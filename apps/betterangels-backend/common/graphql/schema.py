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
            address_components = data.address_components
            structured_address = convert_to_structured_address(address_components)
            address, _ = Address.objects.get_or_create(
                street=(
                    f"{structured_address['street_number']} "
                    f"{structured_address['route']}"
                ),
                city=structured_address["locality"],
                state=structured_address["administrative_area_level_1"],
                zip_code=structured_address["postal_code"],
                address_components=data.address_components,
                formatted_address=data.formatted_address,
            )

            return cast(AddressType, address)

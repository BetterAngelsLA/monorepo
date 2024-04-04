from datetime import datetime
from typing import List, Optional, cast

import strawberry
import strawberry_django
from common.graphql.types import (
    AddressInput,
    AddressType,
    FeatureControlData,
    FlagType,
    SampleType,
    SwitchType,
)
from common.models import Address
from common.permissions.enums import AddressPermissions
from common.utils import convert_to_structured_address
from django.db import transaction
from strawberry.types import Info
from strawberry_django.auth.utils import get_current_user
from strawberry_django.permissions import HasPerm
from waffle import (
    get_waffle_flag_model,
    get_waffle_sample_model,
    get_waffle_switch_model,
)


@strawberry.type
class Query:
    address: AddressType = strawberry_django.field(
        extensions=[HasPerm(AddressPermissions.VIEW)],
    )

    addresses: List[AddressType] = strawberry_django.field(
        extensions=[HasPerm(AddressPermissions.VIEW)],
    )

    @strawberry.field
    def feature_controls(self, info: Info) -> FeatureControlData:
        request = info.context["request"]

        # Fetch flags
        flags = get_waffle_flag_model().get_all()
        flag_data = [
            FlagType(
                name=f.name,
                is_active=f.is_active(request),
                last_modified=cast(Optional[datetime], f.modified),  # type: ignore
            )
            for f in flags
        ]

        # Fetch switches
        switches = get_waffle_switch_model().get_all()
        switch_data = [
            SwitchType(
                name=s.name,
                is_active=s.is_active(),
                last_modified=cast(Optional[datetime], s.modified),  # type: ignore
            )
            for s in switches
        ]

        # Fetch samples
        samples = get_waffle_sample_model().get_all()
        sample_data = [
            SampleType(
                name=s.name,
                is_active=s.is_active(),
                last_modified=cast(Optional[datetime], s.modified),  # type: ignore
            )
            for s in samples
        ]

        return FeatureControlData(
            flags=flag_data,
            switches=switch_data,
            samples=sample_data,
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

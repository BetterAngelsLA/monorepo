from datetime import datetime
from typing import List, Optional, cast

import strawberry
import strawberry_django
from common.graphql.types import (
    AddressType,
    FeatureControlData,
    FlagType,
    NoteLocationType,
    SampleType,
    SwitchType,
)
from common.permissions.enums import LocationPermissions
from strawberry.types import Info
from strawberry_django.permissions import HasPerm
from waffle import (
    get_waffle_flag_model,
    get_waffle_sample_model,
    get_waffle_switch_model,
)


@strawberry.type
class Query:
    location: NoteLocationType = strawberry_django.field(
        extensions=[HasPerm(LocationPermissions.VIEW)],
    )

    locations: List[NoteLocationType] = strawberry_django.field(
        extensions=[HasPerm(LocationPermissions.VIEW)],
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

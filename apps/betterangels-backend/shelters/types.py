from decimal import Decimal
from typing import Any, List, Optional, cast

import strawberry
import strawberry_django
from django.db.models import Q, QuerySet
from strawberry import Info, auto
from strawberry_django.fields import types

from . import models


@strawberry.type
class DescriptionType:
    description: Optional[str]
    typical_stay_description: Optional[str]


@strawberry.type
class BedsType:
    total_beds: Optional[int]
    private_beds: Optional[int]
    available_beds: Optional[int]
    max_stay: Optional[int]
    average_bed_rate: Optional[Decimal]
    bed_layout_description: Optional[str]


@strawberry.type
class ShelterLocationType:
    point: Optional[types.Point]
    spa: Optional[int]
    address: Optional[str]
    city: Optional[str]
    state: Optional[str]
    zip_code: Optional[str]
    confidential: Optional[bool]


@strawberry_django.type(models.Shelter, pagination=True)
class ShelterType:
    id: auto
    title: auto
    image_url: auto

    how_to_enter: auto

    email: auto
    phone: auto
    website: auto

    services: List[str]
    populations: List[str]
    requirements: List[str]

    funders: List[str]

    # TODO: Update the Shelter App to use permissions.  Until then we only expose nonsensitive locations
    @classmethod
    def get_queryset(cls, queryset: QuerySet[models.Shelter], info: Info, **kwargs: Any) -> QuerySet[models.Shelter]:
        return queryset.filter(Q(confidential=False) | Q(confidential__isnull=True))

    # The following fields are likely in need of restrucutring post MVP.
    @strawberry_django.field
    def location(self) -> ShelterLocationType:
        shelter = cast(models.Shelter, self)
        location = shelter.location

        point = address = city = state = zip_code = None
        if location:
            point = location.point
            address = location.address
            city = location.city
            state = location.state
            zip_code = location.zip_code

        return ShelterLocationType(
            point=point,
            spa=shelter.spa,
            address=address,
            city=city,
            state=state,
            zip_code=zip_code,
            confidential=shelter.confidential,
        )

    @strawberry_django.field
    def organization(self) -> str:
        shelter = cast(models.Shelter, self)
        return str(shelter.organization.name) if shelter.organization else ""

    @strawberry_django.field
    def description(self) -> DescriptionType:
        shelter = cast(models.Shelter, self)
        return DescriptionType(
            description=shelter.description,
            typical_stay_description=shelter.typical_stay_description,
        )

    @strawberry_django.field
    def beds(self) -> BedsType:
        shelter = cast(models.Shelter, self)
        return BedsType(
            total_beds=shelter.total_beds,
            private_beds=shelter.private_beds,
            available_beds=shelter.available_beds,
            max_stay=shelter.max_stay,
            average_bed_rate=shelter.average_bed_rate,
            bed_layout_description=shelter.bed_layout_description,
        )

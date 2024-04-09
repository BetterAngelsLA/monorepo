from decimal import Decimal
from typing import List, Optional, cast

import strawberry
import strawberry_django
from strawberry import auto
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
class LocationType:
    point: Optional[types.Point]
    spa: Optional[int]
    address: str
    city: Optional[str]
    state: Optional[str]
    zip_code: Optional[int]
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

    # The following fields are likely in need of restrucutring post MVP.
    def location(self) -> LocationType:
        shelter = cast(models.Shelter, self)
        return LocationType(
            point=shelter.location.point,
            spa=shelter.spa,
            address=shelter.location.address,
            city=shelter.location.city,
            state=shelter.location.state,
            zip_code=shelter.location.zip_code,
            confidential=shelter.confidential,
        )

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

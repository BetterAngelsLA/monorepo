from typing import Optional, List

import strawberry_django
import strawberry

from strawberry import auto

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
    average_bed_rate: Optional[float]
    bed_layout_description: str


@strawberry.type
class LocationType:
    latitude: Optional[float]
    longitude: Optional[float]
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

    # I've been unable to figure out how to resolve the mypy errors here as it
    # does not detect the strawberry-django behavior of resolving fields in the
    # parent Shelter class, even when I annotate self as a Shelter
    @strawberry_django.field
    def location(self) -> LocationType:
        return LocationType(
            latitude=self.location.point.x,
            longitude=self.location.point.y,
            spa=self.spa,
            address=self.location.address,
            city=self.location.city,
            state=self.location.state,
            zip_code=self.location.zip_code,
            confidential=self.confidential,
        )

    @strawberry_django.field
    def description(self) -> DescriptionType:
        return DescriptionType(
            description=self.description,
            typical_stay_description=self.typical_stay_description,
        )

    @strawberry_django.field
    def beds(self) -> BedsType:
        return BedsType(
            total_beds=self.total_beds,
            private_beds=self.private_beds,
            available_beds=self.available_beds,
            max_stay=self.max_stay,
            average_bed_rate=self.average_bed_rate,
            bed_layout_description=self.bed_layout_description,
        )

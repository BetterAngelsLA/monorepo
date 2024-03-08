import dataclasses
import decimal

import strawberry_django
import strawberry

from strawberry import auto
from strawberry.types import Info
from typing import List

from . import models


@dataclasses.dataclass
@strawberry_django.type(models.Service)
class ServiceType:
    title: auto


@dataclasses.dataclass
@strawberry_django.type(models.Location)
class LocationType:
    address: auto
    city: auto
    state: auto
    zip_code: auto
    confidential: auto
    latitude: auto
    longitude: auto


@strawberry.type
class DescriptionType:
    description: str
    bed_layout_description: str
    typical_stay_description: str


@strawberry.type
class BedsType:
    total_beds: int
    private_beds: int
    max_stay: int
    average_bed_rate: float


@dataclasses.dataclass
@strawberry_django.type(models.Shelter, pagination=True)
class ShelterType:
    id: auto
    title: auto
    image_url: auto
    location: LocationType
    how_to_enter: str
    max_stay: auto

    email: auto
    phone: auto
    website: auto

    services: List[str]
    populations: List[str]
    requirements: List[str]

    description: DescriptionType

    beds: BedsType

    def resolve_services(self, info: Info) -> List[str]:
        return [service.title for service in self.services.all()]

    def resolve_populations(self, info: Info) -> List[str]:
        return [population.title for population in self.populations.all()]

    def resolve_requirements(self, info: Info) -> List[str]:
        return [requirement.title for requirement in self.requirements.all()]

    def resolve_description(self, info: Info) -> DescriptionType:
        return DescriptionType(
            description=self.description,
            bed_layout_description=self.bed_layout_description,
            typical_stay_description=self.typical_stay_description,
        )

    def resolve_beds(self, info: Info) -> BedsType:
        return BedsType(
            total_beds=self.total_beds,
            private_beds=self.private_beds,
            max_stay=self.max_stay,
            average_bed_rate=self.average_bed_rate
        )

import dataclasses
from typing import Any, Dict, cast

import strawberry_django
from accounts.types import UserType
from django.db.models import QuerySet

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

    description: auto
    bed_layout_description: auto
    typical_stay_description: auto

    services: List[str]
    def resolve_services(self, info) -> List[str]:
        return [service.title for service in self.services.all()]

    population: List[str]
    def resolve_populations(self, info) -> List[str]:
        return [population.title for population in self.populations.all()]

    requirements: List[str]
    def resolve_requirements(self, info) -> List[str]:
        return [requirement.title for requirement in self.requirements.all()]




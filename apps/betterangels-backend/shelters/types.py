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
    services: List[ServiceType]

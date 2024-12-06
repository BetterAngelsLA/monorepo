from typing import cast

import strawberry
import strawberry_django
from django.db.models import Prefetch
from shelters.models import ExteriorPhoto, InteriorPhoto, Shelter
from shelters.types import ShelterType
from strawberry_django.pagination import OffsetPaginated


@strawberry.type
class Query:
    shelter: ShelterType = strawberry_django.field()
    shelters: OffsetPaginated[ShelterType] = strawberry_django.offset_paginated()

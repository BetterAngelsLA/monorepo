from typing import Optional

import strawberry
import strawberry_django
from django.db.models import QuerySet
from shelters.enums import StatusChoices
from shelters.models import Shelter
from shelters.types import ShelterOrder, ShelterType
from strawberry_django.pagination import OffsetPaginated


@strawberry.type
class Query:
    shelter: ShelterType = strawberry_django.field()

    @strawberry_django.offset_paginated(OffsetPaginated[ShelterType])
    def shelters(self, ordering: Optional[list[ShelterOrder]] = None) -> QuerySet:
        return Shelter.objects.filter(status=StatusChoices.APPROVED)

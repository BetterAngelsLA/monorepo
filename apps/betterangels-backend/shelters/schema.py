from typing import cast

import strawberry
import strawberry_django
from django.db.models import Prefetch
from shelters.models import Shelter
from shelters.types import ShelterType
from strawberry_django.pagination import OffsetPaginated


@strawberry.type
class Query:
    shelter: ShelterType = strawberry_django.field()

    @strawberry_django.offset_paginated()
    def shelters(self) -> OffsetPaginated[ShelterType]:
        shelters = Shelter.objects.prefetch_related(
            Prefetch(
                "exterior_photos",
                to_attr="prefetched_exterior_photos",
            ),
            Prefetch(
                "interior_photos",
                to_attr="prefetched_interior_photos",
            ),
        )

        return cast(OffsetPaginated[ShelterType], shelters)

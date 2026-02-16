from typing import Optional, cast

import strawberry
import strawberry_django
from common.permissions.utils import IsAuthenticated
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import QuerySet
from shelters.enums import StatusChoices
from shelters.models import Bed, Shelter
from shelters.permissions import BedPermissions, ShelterPermissions
from shelters.types import BedType, CreateBedInput, ShelterOrder, ShelterType
from strawberry_django.pagination import OffsetPaginated
from strawberry_django.permissions import HasPerm


@strawberry.type
class Query:
    shelter: ShelterType = strawberry_django.field()

    @strawberry_django.offset_paginated(OffsetPaginated[ShelterType])
    def shelters(self, ordering: Optional[list[ShelterOrder]] = None) -> QuerySet:
        return Shelter.objects.filter(status=StatusChoices.APPROVED)

    admin_shelters: OffsetPaginated[ShelterType] = strawberry_django.offset_paginated(
        permission_classes=[IsAuthenticated],
        extensions=[HasPerm(ShelterPermissions.VIEW)],
    )


@strawberry.type
class Mutation:
    @strawberry.mutation(permission_classes=[IsAuthenticated], extensions=[HasPerm(BedPermissions.ADD)])
    def create_bed(self, input: CreateBedInput) -> BedType:
        try:
            shelter = Shelter.objects.get(pk=input.shelter_id)
        except Shelter.DoesNotExist:
            raise ObjectDoesNotExist(f"Shelter matching ID {input.shelter_id} could not be found.")

        bed = Bed.objects.create(
            shelter_id=shelter,
            status=input.status,
        )

        return cast(BedType, bed)

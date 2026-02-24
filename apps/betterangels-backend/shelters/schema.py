from typing import cast

import strawberry
import strawberry_django
from common.permissions.utils import IsAuthenticated
from django.core.exceptions import ObjectDoesNotExist
from shelters.models import Bed, Shelter
from shelters.permissions import BedPermissions, ShelterPermissions
from shelters.types import AdminShelterType, BedType, CreateBedInput, ShelterType
from strawberry_django.pagination import OffsetPaginated
from strawberry_django.permissions import HasPerm


@strawberry.type
class Query:
    admin_shelters: OffsetPaginated[AdminShelterType] = strawberry_django.offset_paginated(
        permission_classes=[IsAuthenticated],
        extensions=[HasPerm(ShelterPermissions.VIEW)],
    )

    shelters: OffsetPaginated[ShelterType] = strawberry_django.offset_paginated()

    shelter: ShelterType = strawberry_django.field()


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

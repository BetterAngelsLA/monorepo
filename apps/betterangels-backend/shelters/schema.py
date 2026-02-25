import strawberry
import strawberry_django
from common.permissions.utils import IsAuthenticated
from graphql import GraphQLError
from shelters.models import Bed, Shelter
from shelters.permissions import ShelterPermissions
from shelters.types import (
    AdminShelterType,
    CreateBedInput,
    CreateBedPayload,
    ShelterType,
)
from strawberry.types import Info
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
class DeleteShelterPayload:
    success: bool


@strawberry.type
class Mutation:
    @strawberry.mutation
    def create_bed(self, info: strawberry.Info, input: CreateBedInput) -> CreateBedPayload:
        try:
            shelter = Shelter.objects.get(id=input.shelterId)
        except Shelter.DoesNotExist:
            raise GraphQLError("Shelter not found.")

        bed = Bed.objects.create(
            shelter_id=shelter,
            status=input.status,
        )

        return CreateBedPayload(
            id=strawberry.ID(str(bed.id)),
            status=bed.status,
            shelterId=strawberry.ID(str(bed.shelter_id.id)),
        )

    @strawberry.mutation
    def delete_shelter(self, info: Info, id: strawberry.ID) -> DeleteShelterPayload:
        try:
            shelter = Shelter.objects.get(id=id, deleted_at__isnull=True)
        except Shelter.DoesNotExist:
            raise GraphQLError("Shelter not found.")
        shelter.delete_shelter()
        return DeleteShelterPayload(success=True)

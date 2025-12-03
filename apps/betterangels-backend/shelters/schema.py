from graphql import GraphQLError
import strawberry
import strawberry_django
from django.db.models import QuerySet
from graphql import GraphQLError
from shelters.enums import StatusChoices
from shelters.models import Bed, Shelter
from shelters.types import CreateBedInput, CreateBedPayload, ShelterType
from strawberry.types import Info
from strawberry_django.pagination import OffsetPaginated


@strawberry.type
class Query:
    shelter: ShelterType = strawberry_django.field()

    @strawberry_django.offset_paginated(OffsetPaginated[ShelterType])
    def shelters(self) -> QuerySet:
        return Shelter.objects.filter(status=StatusChoices.APPROVED)


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

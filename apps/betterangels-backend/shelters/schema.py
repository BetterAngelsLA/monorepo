import strawberry
import strawberry_django
from django.db.models import QuerySet
from graphql import GraphQLError
from shelters.enums import StatusChoices
from shelters.models import Shelter
from shelters.types import ShelterType
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
    def delete_shelter(self, info: Info, id: strawberry.ID) -> DeleteShelterPayload:
        try:
            shelter = Shelter.objects.get(id=id, deleted_at__isnull=True)
        except Shelter.DoesNotExist:
            raise GraphQLError("Shelter not found.")
        shelter.delete_shelter()
        return DeleteShelterPayload(success=True)

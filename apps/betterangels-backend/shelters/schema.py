from typing import cast

import strawberry
import strawberry_django
from django.db import transaction
from shelters.models import Shelter
from shelters.types import ShelterType
from strawberry.types import Info
from strawberry_django.mutations import resolvers
from strawberry_django.pagination import OffsetPaginated


@strawberry.type
class Query:
    shelter: ShelterType = strawberry_django.field()
    shelters: OffsetPaginated[ShelterType] = strawberry_django.offset_paginated()

@strawberry.input
class ShelterLocationInput:
    place: str

@strawberry.input
class CreateShelterInput:
    name: str
    description: str


@strawberry.type
class Mutation:
    @strawberry_django.mutation
    def create_shelter(self, info: Info, input: CreateShelterInput) -> ShelterType:
        with transaction.atomic():
            shelter_data = strawberry.asdict(input)
            shelter = resolvers.create(info, Shelter, shelter_data)

        return cast(ShelterType, shelter)

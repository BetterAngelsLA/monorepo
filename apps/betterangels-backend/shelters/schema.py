from typing import cast

import strawberry
import strawberry_django
from common.permissions.utils import IsAuthenticated
from django.core.exceptions import ValidationError
from graphql import GraphQLError
from shelters.permissions import ShelterPermissions
from shelters.services import shelter_create
from shelters.types import AdminShelterType, CreateShelterInput, ShelterType
from strawberry import UNSET
from strawberry.types import Info
from strawberry_django.pagination import OffsetPaginated
from strawberry_django.permissions import HasPerm


@strawberry.type
class Query:
    admin_shelters: OffsetPaginated[AdminShelterType] = strawberry_django.offset_paginated(
        permission_classes=[IsAuthenticated],
        extensions=[HasPerm(ShelterPermissions.VIEW)],
    )

    shelter: ShelterType = strawberry_django.field()
    shelters: OffsetPaginated[ShelterType] = strawberry_django.offset_paginated()


@strawberry.type
class Mutation:
    @strawberry_django.mutation(permission_classes=[IsAuthenticated], extensions=[HasPerm(ShelterPermissions.ADD)])
    def create_shelter(self, info: Info, input: CreateShelterInput) -> ShelterType:
        data = {k: v for k, v in strawberry.asdict(input).items() if v is not UNSET}

        try:
            shelter = shelter_create(data=data)
        except ValidationError as exc:
            if hasattr(exc, "message_dict"):
                errors = [{"field": f, "messages": msgs} for f, msgs in exc.message_dict.items()]
            else:
                errors = [{"field": "__all__", "messages": exc.messages}]
            raise GraphQLError("Validation Errors", extensions={"errors": errors}) from exc

        return cast(ShelterType, shelter)

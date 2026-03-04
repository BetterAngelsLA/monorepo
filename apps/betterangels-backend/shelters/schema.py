from typing import cast

import strawberry
import strawberry_django
from common.permissions.utils import IsAuthenticated
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from graphql import GraphQLError
from shelters.models import Shelter
from shelters.permissions import BedPermissions, RoomPermissions, ShelterPermissions
from shelters.services import bed_create, room_create, shelter_create
from shelters.types import (
    AdminShelterType,
    BedType,
    CreateBedInput,
    CreateRoomInput,
    CreateShelterInput,
    RoomType,
    ShelterType,
)
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
    def create_shelter(self, info: Info, data: CreateShelterInput) -> ShelterType:
        clean = {k: v for k, v in strawberry.asdict(data).items() if v is not UNSET}

        try:
            shelter = shelter_create(data=clean)
        except ValidationError as exc:
            if hasattr(exc, "message_dict"):
                errors = [{"field": f, "messages": msgs} for f, msgs in exc.message_dict.items()]
            else:
                errors = [{"field": "__all__", "messages": exc.messages}]
            raise GraphQLError("Validation Errors", extensions={"errors": errors}) from exc

        return cast(ShelterType, shelter)

    @strawberry_django.mutation(permission_classes=[IsAuthenticated], extensions=[HasPerm(BedPermissions.ADD)])
    def create_bed(self, info: Info, data: CreateBedInput) -> BedType:
        try:
            bed = bed_create(data=strawberry.asdict(data))
        except Shelter.DoesNotExist:
            raise ObjectDoesNotExist(f"Shelter matching ID {data.shelter_id} could not be found.")

        return cast(BedType, bed)

    @strawberry_django.mutation(permission_classes=[IsAuthenticated], extensions=[HasPerm(RoomPermissions.ADD)])
    def create_room(self, info: Info, data: CreateRoomInput) -> RoomType:
        try:
            room = room_create(data=strawberry.asdict(data))
        except Shelter.DoesNotExist:
            raise ObjectDoesNotExist(f"Shelter matching ID {data.shelter_id} could not be found.")
        except ValidationError as exc:
            if hasattr(exc, "message_dict"):
                errors = [{"field": f, "messages": msgs} for f, msgs in exc.message_dict.items()]
            else:
                errors = [{"field": "__all__", "messages": exc.messages}]
            raise GraphQLError("Validation Errors", extensions={"errors": errors}) from exc

        return cast(RoomType, room)

from typing import cast

import strawberry
import strawberry_django
from accounts.models import User
from common.graphql.utils import strip_unset
from common.permissions.utils import IsAuthenticated
from shelters import models
from shelters.permissions import (
    BedPermissions,
    RoomPermissions,
    ServiceCategoryPermissions,
    ServicePermissions,
    ShelterPermissions,
)
from shelters.services import bed_create, room_create, shelter_create
from shelters.types import (
    AdminShelterType,
    BedType,
    CreateBedInput,
    CreateRoomInput,
    CreateShelterInput,
    RoomType,
    ServiceCategoryType,
    ShelterType,
)
from strawberry.types import Info
from strawberry_django.auth.utils import get_current_user
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

    @strawberry_django.field(
        permission_classes=[IsAuthenticated],
        extensions=[
            HasPerm(ServiceCategoryPermissions.VIEW),
            HasPerm(ServicePermissions.VIEW),
        ],
    )
    def shelter_service_categories(self) -> list[ServiceCategoryType]:
        return cast(
            list[ServiceCategoryType],
            list(models.ServiceCategory.objects.prefetch_related("services").all()),
        )


@strawberry.type
class Mutation:
    @strawberry_django.mutation(permission_classes=[IsAuthenticated], extensions=[HasPerm(ShelterPermissions.ADD)])
    def create_shelter(self, info: Info, data: CreateShelterInput) -> ShelterType:
        user = cast(User, get_current_user(info))
        clean = strip_unset(strawberry.asdict(data))
        return cast(ShelterType, shelter_create(user=user, data=clean))

    @strawberry_django.mutation(permission_classes=[IsAuthenticated], extensions=[HasPerm(BedPermissions.ADD)])
    def create_bed(self, info: Info, data: CreateBedInput) -> BedType:
        user = cast(User, get_current_user(info))
        clean = strip_unset(strawberry.asdict(data))
        return cast(BedType, bed_create(user=user, data=clean))

    @strawberry_django.mutation(permission_classes=[IsAuthenticated], extensions=[HasPerm(RoomPermissions.ADD)])
    def create_room(self, info: Info, data: CreateRoomInput) -> RoomType:
        user = cast(User, get_current_user(info))
        clean = strip_unset(strawberry.asdict(data))
        return cast(RoomType, room_create(user=user, data=clean))

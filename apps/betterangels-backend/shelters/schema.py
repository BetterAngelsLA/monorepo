from typing import Optional, cast

import strawberry
import strawberry_django
from accounts.models import User
from accounts.types import AuthResponse
from common.permissions.utils import IsAuthenticated
from django.db.models import Max
from shelters.enums import StatusChoices
from shelters.models import Shelter
from shelters.permissions import BedPermissions, RoomPermissions, ShelterPermissions
from shelters.services import (
    bed_create,
    room_create,
    shelter_create,
    shelter_invite_accept,
    shelter_operator_register,
)
from shelters.types import (
    AcceptShelterInviteInput,
    AdminShelterType,
    BedType,
    CreateBedInput,
    CreateRoomInput,
    CreateShelterInput,
    RegisterShelterOperatorInput,
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

    beds: OffsetPaginated[BedType] = strawberry_django.offset_paginated(
        permission_classes=[IsAuthenticated],
        extensions=[HasPerm(BedPermissions.VIEW)],
    )
    rooms: OffsetPaginated[RoomType] = strawberry_django.offset_paginated(
        permission_classes=[IsAuthenticated],
        extensions=[HasPerm(RoomPermissions.VIEW)],
    )

    shelter_service_categories: OffsetPaginated[ServiceCategoryType] = strawberry_django.offset_paginated(
        permission_classes=[IsAuthenticated],
    )

    @strawberry.field()
    def shelter_max_stay(self, info: Info) -> Optional[int]:
        return Shelter.objects.filter(status=StatusChoices.APPROVED).aggregate(Max("max_stay"))["max_stay__max"] or None


@strawberry.type
class Mutation:
    @strawberry_django.mutation(permission_classes=[IsAuthenticated], extensions=[HasPerm(ShelterPermissions.ADD)])
    def create_shelter(self, info: Info, data: CreateShelterInput) -> ShelterType:
        user = cast(User, get_current_user(info))
        clean = strawberry.asdict(data)
        return cast(ShelterType, shelter_create(user=user, data=clean))

    @strawberry_django.mutation(permission_classes=[IsAuthenticated], extensions=[HasPerm(BedPermissions.ADD)])
    def create_bed(self, info: Info, data: CreateBedInput) -> BedType:
        user = cast(User, get_current_user(info))
        clean = strawberry.asdict(data)
        return cast(BedType, bed_create(user=user, data=clean))

    @strawberry_django.mutation(permission_classes=[IsAuthenticated], extensions=[HasPerm(RoomPermissions.ADD)])
    def create_room(self, info: Info, data: CreateRoomInput) -> RoomType:
        user = cast(User, get_current_user(info))
        clean = strawberry.asdict(data)
        return cast(RoomType, room_create(user=user, data=clean))

    @strawberry.mutation
    def register_shelter_operator(self, info: Info, data: RegisterShelterOperatorInput) -> AuthResponse:
        """Register a new shelter operator: creates user, organization, and assigns ownership.

        The user is created without a password. After this mutation succeeds,
        the client should use the allauth login-by-code flow to authenticate.
        """
        shelter_operator_register(
            email=data.email,
            first_name=data.first_name,
            last_name=data.last_name,
            organization_name=data.organization_name,
        )

        return AuthResponse(status_code="200")

    @strawberry.mutation
    def accept_shelter_invite(self, info: Info, data: AcceptShelterInviteInput) -> AuthResponse:
        """Accept an invitation to join a shelter organization.

        The user is activated without a password. After this mutation succeeds,
        the client should use the allauth login-by-code flow to authenticate.
        """
        shelter_invite_accept(
            invite_id=data.invite_id,
            first_name=data.first_name,
            last_name=data.last_name,
        )

        return AuthResponse(status_code="200")

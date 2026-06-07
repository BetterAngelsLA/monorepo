from typing import Optional, cast

import strawberry
import strawberry_django
from accounts.models import User
from common.permissions.utils import IsAuthenticated
from django.db.models import Max
from shelters.enums import StatusChoices
from shelters.models import Bed, Room, Shelter, Reservation
from shelters.services.bed import bed_create
from shelters.services.room import room_create
from shelters.services.reservation import reservation_update, reservation_update_status
from shelters.services.shelter import shelter_create, shelter_update
from shelters.types import (
    AdminShelterType,
    BedType,
    CityType,
    CreateBedInput,
    CreateRoomInput,
    CreateShelterInput,
    ReservationType,
    RoomType,
    ServiceCategoryType,
    ShelterType,
    SPAType,
    UpdateReservationInput,
    UpdateReservationStatusInput,
    UpdateShelterInput,
)
from strawberry.types import Info
from strawberry_django.auth.utils import get_current_user
from strawberry_django.pagination import OffsetPaginated
from strawberry_django.permissions import HasPerm


@strawberry.type
class Query:
    admin_shelter: AdminShelterType = strawberry_django.field(
        permission_classes=[IsAuthenticated],
        extensions=[HasPerm(Shelter.perms.VIEW)],
    )
    admin_shelters: OffsetPaginated[AdminShelterType] = strawberry_django.offset_paginated(
        permission_classes=[IsAuthenticated],
        extensions=[HasPerm(Shelter.perms.VIEW)],
    )

    shelter: ShelterType = strawberry_django.field()
    shelters: OffsetPaginated[ShelterType] = strawberry_django.offset_paginated()

    beds: OffsetPaginated[BedType] = strawberry_django.offset_paginated(
        permission_classes=[IsAuthenticated],
        extensions=[HasPerm(Bed.perms.VIEW)],
    )
    rooms: OffsetPaginated[RoomType] = strawberry_django.offset_paginated(
        permission_classes=[IsAuthenticated],
        extensions=[HasPerm(Room.perms.VIEW)],
    )

    shelter_service_categories: OffsetPaginated[ServiceCategoryType] = strawberry_django.offset_paginated(
        permission_classes=[IsAuthenticated],
    )

    shelter_cities: OffsetPaginated[CityType] = strawberry_django.offset_paginated(
        permission_classes=[IsAuthenticated],
    )
    shelter_spas: OffsetPaginated[SPAType] = strawberry_django.offset_paginated(
        permission_classes=[IsAuthenticated],
    )

    @strawberry.field()
    def shelter_max_stay(self, info: Info) -> Optional[int]:
        return Shelter.objects.filter(status=StatusChoices.APPROVED).aggregate(Max("max_stay"))["max_stay__max"] or None


@strawberry.type
class Mutation:
    @strawberry_django.mutation(permission_classes=[IsAuthenticated], extensions=[HasPerm(Shelter.perms.ADD)])
    def create_shelter(self, info: Info, data: CreateShelterInput) -> ShelterType:
        user = cast(User, get_current_user(info))
        clean = strawberry.asdict(data)
        return cast(ShelterType, shelter_create(user=user, data=clean))

    @strawberry_django.mutation(permission_classes=[IsAuthenticated], extensions=[HasPerm(Shelter.perms.CHANGE)])
    def update_shelter(self, info: Info, data: UpdateShelterInput) -> ShelterType:
        user = cast(User, get_current_user(info))
        clean = strawberry.asdict(data)
        return cast(ShelterType, shelter_update(user=user, data=clean))

    @strawberry_django.mutation(permission_classes=[IsAuthenticated], extensions=[HasPerm(Bed.perms.ADD)])
    def create_bed(self, info: Info, data: CreateBedInput) -> BedType:
        user = cast(User, get_current_user(info))
        clean = strawberry.asdict(data)
        return cast(BedType, bed_create(user=user, data=clean))

    @strawberry_django.mutation(permission_classes=[IsAuthenticated], extensions=[HasPerm(Room.perms.ADD)])
    def create_room(self, info: Info, data: CreateRoomInput) -> RoomType:
        user = cast(User, get_current_user(info))
        clean = strawberry.asdict(data)
        return cast(RoomType, room_create(user=user, data=clean))

    @strawberry_django.mutation(permission_classes=[IsAuthenticated], extensions=[HasPerm(Reservation.perms.CHANGE)])
    def update_reservation(self, info: Info, data: UpdateReservationInput) -> ReservationType:
        user = cast(User, get_current_user(info))
        clean = strawberry.asdict(data)
        return cast(ReservationType, reservation_update(user=user, data=clean))

    @strawberry_django.mutation(permission_classes=[IsAuthenticated], extensions=[HasPerm(Reservation.perms.CHANGE)])
    def update_reservation_status(self, info: Info, data: UpdateReservationStatusInput) -> ReservationType:
        user = cast(User, get_current_user(info))
        clean = strawberry.asdict(data)
        return cast(ReservationType, reservation_update_status(user=user, reservation_id=clean["reservation_id"], status=clean["status"]))

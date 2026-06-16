from typing import Optional, cast

import strawberry
import strawberry_django
from accounts.extensions import HasOrgPerm
from accounts.models import User
from common.graphql.types import BulkDeleteInput, BulkDeleteResult
from common.permissions.utils import IsAuthenticated, get_current_organization
from django.db.models import Max
from shelters.enums import StatusChoices
from shelters.models import Bed, Room, Shelter
from shelters.services.bed import bed_clone, bed_create, bed_delete, bed_update
from shelters.services.room import room_clone, room_create, room_delete, room_update
from shelters.services.shelter import shelter_create, shelter_update
from shelters.types import (
    AdminShelterType,
    BedType,
    CityType,
    CreateBedInput,
    CreateRoomInput,
    CreateShelterInput,
    RoomType,
    ServiceCategoryType,
    ShelterType,
    SPAType,
    UpdateBedInput,
    UpdateRoomInput,
    UpdateShelterInput,
)
from strawberry import ID
from strawberry.types import Info
from strawberry_django.auth.utils import get_current_user
from strawberry_django.pagination import OffsetPaginated
from strawberry_django.permissions import HasPerm


@strawberry.type
class Query:
    admin_shelter: AdminShelterType = strawberry_django.field(
        permission_classes=[IsAuthenticated],
        extensions=[HasOrgPerm(Shelter.perms.VIEW)],
    )
    admin_shelters: OffsetPaginated[AdminShelterType] = strawberry_django.offset_paginated(
        permission_classes=[IsAuthenticated],
        extensions=[HasOrgPerm(Shelter.perms.VIEW)],
    )

    shelter: ShelterType = strawberry_django.field()
    shelters: OffsetPaginated[ShelterType] = strawberry_django.offset_paginated()

    bed: BedType = strawberry_django.field(
        permission_classes=[IsAuthenticated],
        extensions=[HasOrgPerm(Bed.perms.VIEW)],
    )
    beds: OffsetPaginated[BedType] = strawberry_django.offset_paginated(
        permission_classes=[IsAuthenticated],
        extensions=[HasOrgPerm(Bed.perms.VIEW)],
    )

    room: RoomType = strawberry_django.field(
        permission_classes=[IsAuthenticated],
        extensions=[HasOrgPerm(Room.perms.VIEW)],
    )
    rooms: OffsetPaginated[RoomType] = strawberry_django.offset_paginated(
        permission_classes=[IsAuthenticated],
        extensions=[HasOrgPerm(Room.perms.VIEW)],
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

    @strawberry_django.mutation(permission_classes=[IsAuthenticated], extensions=[HasOrgPerm(Room.perms.ADD)])
    def create_room(self, info: Info, data: CreateRoomInput) -> RoomType:
        user = cast(User, get_current_user(info))
        clean = strawberry.asdict(data)
        return cast(RoomType, room_create(user=user, data=clean, organization_id=get_current_organization(info)))

    @strawberry_django.mutation(permission_classes=[IsAuthenticated], extensions=[HasOrgPerm(Room.perms.CHANGE)])
    def update_room(self, info: Info, id: ID, data: UpdateRoomInput) -> RoomType:
        user = cast(User, get_current_user(info))
        clean = strawberry.asdict(data)
        return cast(RoomType, room_update(user=user, room_id=id, data=clean, organization_id=get_current_organization(info)))

    @strawberry_django.mutation(permission_classes=[IsAuthenticated], extensions=[HasOrgPerm(Room.perms.ADD)])
    def clone_room(self, info: Info, id: ID) -> RoomType:
        user = cast(User, get_current_user(info))
        return cast(RoomType, room_clone(user=user, room_id=id, organization_id=get_current_organization(info)))

    @strawberry_django.mutation(permission_classes=[IsAuthenticated], extensions=[HasOrgPerm(Room.perms.DELETE)])
    def delete_rooms(self, info: Info, data: BulkDeleteInput) -> BulkDeleteResult:
        user = cast(User, get_current_user(info))
        ids = [int(id) for id in data.ids]
        deleted_ids = room_delete(user=user, ids=ids, organization_id=get_current_organization(info))
        return BulkDeleteResult(ids=[cast(ID, id) for id in deleted_ids])

    @strawberry_django.mutation(permission_classes=[IsAuthenticated], extensions=[HasOrgPerm(Bed.perms.ADD)])
    def create_bed(self, info: Info, data: CreateBedInput) -> BedType:
        user = cast(User, get_current_user(info))
        clean = strawberry.asdict(data)
        return cast(BedType, bed_create(user=user, data=clean, organization_id=get_current_organization(info)))

    @strawberry_django.mutation(permission_classes=[IsAuthenticated], extensions=[HasOrgPerm(Bed.perms.CHANGE)])
    def update_bed(self, info: Info, id: ID, data: UpdateBedInput) -> BedType:
        user = cast(User, get_current_user(info))
        clean = strawberry.asdict(data)
        return cast(BedType, bed_update(user=user, bed_id=id, data=clean, organization_id=get_current_organization(info)))

    @strawberry_django.mutation(permission_classes=[IsAuthenticated], extensions=[HasOrgPerm(Bed.perms.ADD)])
    def clone_bed(self, info: Info, id: ID) -> BedType:
        user = cast(User, get_current_user(info))
        return cast(BedType, bed_clone(user=user, bed_id=id, organization_id=get_current_organization(info)))

    @strawberry_django.mutation(permission_classes=[IsAuthenticated], extensions=[HasOrgPerm(Bed.perms.DELETE)])
    def delete_beds(self, info: Info, data: BulkDeleteInput) -> BulkDeleteResult:
        user = cast(User, get_current_user(info))
        ids = [int(id) for id in data.ids]
        deleted_ids = bed_delete(user=user, ids=ids, organization_id=get_current_organization(info))
        return BulkDeleteResult(ids=[cast(ID, id) for id in deleted_ids])
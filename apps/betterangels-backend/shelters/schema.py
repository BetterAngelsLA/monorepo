from typing import Optional, cast

import strawberry
import strawberry_django
from accounts.extensions import HasOrgPerm
from accounts.models import User
from common.graphql.types import (
    AuthorizedPresignedS3UploadsType,
    BulkDeleteInput,
    BulkDeleteResult,
)
from common.permissions.utils import IsAuthenticated, get_current_organization
from django.db.models import Max
from shelters.enums import StatusChoices
from shelters.models import Bed, Reservation, Room, Shelter
from shelters.services import shelter_photo
from shelters.services.shelter_photo import GenerateUploadItem, ShelterPhotoResolveItem
from shelters.services.bed import bed_clone, bed_create, bed_delete, bed_update
from shelters.services.reservation import reservation_create, reservation_delete, reservation_update
from shelters.services.room import room_clone, room_create, room_delete, room_update
from shelters.services.shelter import shelter_create, shelter_update
from shelters.types import (
    BedType,
    CityType,
    CreateBedInput,
    CreateReservationInput,
    CreateRoomInput,
    CreateShelterInput,
    GenerateShelterPhotoUploadsInput,
    OperatorShelterType,
    ReservationType,
    ResolveShelterPhotoUploadsInput,
    RoomType,
    ServiceCategoryType,
    ShelterPhotoType,
    ShelterPhotoUploadsType,
    ShelterType,
    SPAType,
    UpdateBedInput,
    UpdateReservationInput,
    UpdateRoomInput,
    UpdateShelterInput,
    UpdateShelterPhotoInput,
)
from strawberry import ID
from strawberry.types import Info
from strawberry_django.auth.utils import get_current_user
from strawberry_django.pagination import OffsetPaginated


@strawberry.type
class Query:
    operator_shelter: OperatorShelterType = strawberry_django.field(
        permission_classes=[IsAuthenticated],
        extensions=[HasOrgPerm(Shelter.perms.VIEW)],
    )
    operator_shelters: OffsetPaginated[OperatorShelterType] = strawberry_django.offset_paginated(
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

    reservation: ReservationType = strawberry_django.field(
        permission_classes=[IsAuthenticated],
        extensions=[HasOrgPerm(Reservation.perms.VIEW)],
    )
    reservations: OffsetPaginated[ReservationType] = strawberry_django.offset_paginated(
        permission_classes=[IsAuthenticated],
        extensions=[HasOrgPerm(Reservation.perms.VIEW)],
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
    # ── Shelter ────────────────────────────────────────────────────────────

    @strawberry_django.mutation(permission_classes=[IsAuthenticated], extensions=[HasOrgPerm(Shelter.perms.ADD)])
    def create_shelter(self, info: Info, data: CreateShelterInput) -> ShelterType:
        user = cast(User, get_current_user(info))
        org_id = get_current_organization(info)
        clean = strawberry.asdict(data)
        return cast(ShelterType, shelter_create(user=user, organization_id=org_id, data=clean))

    @strawberry_django.mutation(
        permission_classes=[IsAuthenticated],
        extensions=[HasOrgPerm(Shelter.perms.CHANGE)],
    )
    def update_shelter(self, info: Info, data: UpdateShelterInput) -> ShelterType:
        user = cast(User, get_current_user(info))
        org_id = get_current_organization(info)
        clean = strawberry.asdict(data)
        return cast(ShelterType, shelter_update(user=user, organization_id=org_id, data=clean))

    # ── Room ───────────────────────────────────────────────────────────────

    @strawberry_django.mutation(permission_classes=[IsAuthenticated], extensions=[HasOrgPerm(Room.perms.ADD)])
    def create_room(self, info: Info, data: CreateRoomInput) -> RoomType:
        user = cast(User, get_current_user(info))
        org_id = get_current_organization(info)
        clean = strawberry.asdict(data)
        return cast(RoomType, room_create(user=user, organization_id=org_id, data=clean))

    @strawberry_django.mutation(permission_classes=[IsAuthenticated], extensions=[HasOrgPerm(Room.perms.CHANGE)])
    def update_room(self, info: Info, id: ID, data: UpdateRoomInput) -> RoomType:
        user = cast(User, get_current_user(info))
        org_id = get_current_organization(info)
        clean = strawberry.asdict(data)
        return cast(
            RoomType,
            room_update(user=user, organization_id=org_id, room_id=id, data=clean),
        )

    @strawberry_django.mutation(permission_classes=[IsAuthenticated], extensions=[HasOrgPerm(Room.perms.ADD)])
    def clone_room(self, info: Info, id: ID) -> RoomType:
        user = cast(User, get_current_user(info))
        org_id = get_current_organization(info)
        return cast(RoomType, room_clone(user=user, organization_id=org_id, room_id=str(id)))

    @strawberry_django.mutation(permission_classes=[IsAuthenticated], extensions=[HasOrgPerm(Room.perms.DELETE)])
    def delete_rooms(self, info: Info, data: BulkDeleteInput) -> BulkDeleteResult:
        user = cast(User, get_current_user(info))
        org_id = get_current_organization(info)
        ids = [int(id) for id in data.ids]
        deleted_ids = room_delete(user=user, organization_id=org_id, room_ids=ids)
        return BulkDeleteResult(ids=[cast(ID, id) for id in deleted_ids])

    # ── Bed ────────────────────────────────────────────────────────────────

    @strawberry_django.mutation(permission_classes=[IsAuthenticated], extensions=[HasOrgPerm(Bed.perms.ADD)])
    def create_bed(self, info: Info, data: CreateBedInput) -> BedType:
        user = cast(User, get_current_user(info))
        org_id = get_current_organization(info)
        clean = strawberry.asdict(data)
        return cast(BedType, bed_create(user=user, organization_id=org_id, data=clean))

    @strawberry_django.mutation(permission_classes=[IsAuthenticated], extensions=[HasOrgPerm(Bed.perms.CHANGE)])
    def update_bed(self, info: Info, id: ID, data: UpdateBedInput) -> BedType:
        user = cast(User, get_current_user(info))
        org_id = get_current_organization(info)
        clean = strawberry.asdict(data)
        return cast(
            BedType,
            bed_update(user=user, organization_id=org_id, bed_id=id, data=clean),
        )

    @strawberry_django.mutation(permission_classes=[IsAuthenticated], extensions=[HasOrgPerm(Bed.perms.ADD)])
    def clone_bed(self, info: Info, id: ID) -> BedType:
        user = cast(User, get_current_user(info))
        org_id = get_current_organization(info)
        return cast(BedType, bed_clone(user=user, organization_id=org_id, bed_id=str(id)))

    @strawberry_django.mutation(permission_classes=[IsAuthenticated], extensions=[HasOrgPerm(Bed.perms.DELETE)])
    def delete_beds(self, info: Info, data: BulkDeleteInput) -> BulkDeleteResult:
        user = cast(User, get_current_user(info))
        org_id = get_current_organization(info)
        ids = [int(id) for id in data.ids]
        deleted_ids = bed_delete(user=user, organization_id=org_id, bed_ids=ids)
        return BulkDeleteResult(ids=[cast(ID, id) for id in deleted_ids])

    @strawberry_django.mutation(permission_classes=[IsAuthenticated], extensions=[HasOrgPerm(Reservation.perms.ADD)])
    def create_reservation(self, info: Info, data: CreateReservationInput) -> ReservationType:
        user = cast(User, get_current_user(info))
        org_id = get_current_organization(info)
        clean = strawberry.asdict(data)
        return cast(ReservationType, reservation_create(user=user, organization_id=org_id, data=clean))

    @strawberry_django.mutation(permission_classes=[IsAuthenticated], extensions=[HasOrgPerm(Reservation.perms.CHANGE)])
    def update_reservation(self, info: Info, id: ID, data: UpdateReservationInput) -> ReservationType:
        user = cast(User, get_current_user(info))
        org_id = get_current_organization(info)
        clean = strawberry.asdict(data)
        return cast(
            ReservationType, reservation_update(user=user, organization_id=org_id, reservation_id=id, data=clean)
        )

    @strawberry_django.mutation(permission_classes=[IsAuthenticated], extensions=[HasOrgPerm(Reservation.perms.DELETE)])
    def delete_reservations(self, info: Info, data: BulkDeleteInput) -> BulkDeleteResult:
        user = cast(User, get_current_user(info))
        org_id = get_current_organization(info)
        ids = [int(id) for id in data.ids]
        deleted_ids = reservation_delete(user=user, organization_id=org_id, reservation_ids=ids)
        return BulkDeleteResult(ids=[cast(ID, id) for id in deleted_ids])

    # ── Shelter Photos ─────────────────────────────────────────────────────

    @strawberry_django.mutation(
        permission_classes=[IsAuthenticated],
        extensions=[HasOrgPerm(Shelter.perms.CHANGE)],
    )
    def generate_shelter_photo_uploads(
        self,
        info: Info,
        data: GenerateShelterPhotoUploadsInput,
    ) -> AuthorizedPresignedS3UploadsType:
        user = cast(User, get_current_user(info))
        org_id = get_current_organization(info)

        uploads = [
            GenerateUploadItem(
                ref_id=u.ref_id,
                filename=u.filename,
                content_type=u.content_type,
            )
            for u in data.uploads
        ]
        presigned = shelter_photo.create_presigned_uploads(
            user=user,
            organization_id=org_id,
            shelter_id=data.shelter_id,
            uploads=uploads,
        )

        return AuthorizedPresignedS3UploadsType.from_batch(presigned)

    @strawberry_django.mutation(
        permission_classes=[IsAuthenticated],
        extensions=[HasOrgPerm(Shelter.perms.CHANGE)],
    )
    def resolve_shelter_photo_uploads(
        self,
        info: Info,
        data: ResolveShelterPhotoUploadsInput,
    ) -> ShelterPhotoUploadsType:
        user = cast(User, get_current_user(info))
        org_id = get_current_organization(info)

        items = [
            ShelterPhotoResolveItem(
                presigned_key=p.presigned_key,
                upload_token=p.upload_token,
                filename=p.filename,
                content_type=p.content_type,
                photo_type=p.photo_type,
            )
            for p in data.photos
        ]
        photos = shelter_photo.resolve_uploads(
            user=user,
            organization_id=org_id,
            shelter_id=data.shelter_id,
            photos=items,
        )

        return ShelterPhotoUploadsType(photos=cast(list[ShelterPhotoType], photos))

    @strawberry_django.mutation(
        permission_classes=[IsAuthenticated],
        extensions=[HasOrgPerm(Shelter.perms.CHANGE)],
    )
    def update_shelter_photo(self, info: Info, data: UpdateShelterPhotoInput) -> ShelterPhotoType:
        user = cast(User, get_current_user(info))
        org_id = get_current_organization(info)
        return cast(
            ShelterPhotoType,
            shelter_photo.update_shelter_photo(user=user, organization_id=org_id, data=data),
        )

    @strawberry_django.mutation(
        permission_classes=[IsAuthenticated],
        extensions=[HasOrgPerm(Shelter.perms.CHANGE)],
    )
    def delete_shelter_photos(self, info: Info, data: BulkDeleteInput) -> BulkDeleteResult:
        user = cast(User, get_current_user(info))
        org_id = get_current_organization(info)
        ids = [int(id) for id in data.ids]
        deleted_ids = shelter_photo.delete_shelter_photos(user=user, organization_id=org_id, ids=ids)
        return BulkDeleteResult(ids=[cast(ID, id) for id in deleted_ids])

"""Output types for shelter queries and mutations."""

from datetime import date, datetime
from typing import List, Optional, cast

import strawberry
import strawberry_django
from accounts.models import User
from accounts.types import OrganizationType
from common.enums import ImagePresetEnum
from common.graphql.types import PhoneNumberScalar, TransformableImageType
from common.images import build_img_url
from django.db.models import OuterRef, Prefetch, QuerySet
from shelters import models
from shelters.enums import (
    BedStatusChoices,
    BedTypeChoices,
    ReservationStatusChoices,
    RoomStatusChoices,
    RoomStyleChoices,
    ShelterPhotoTypeChoices,
)
from shelters.managers import (
    bed_computed_status_annotation,
    room_computed_status_annotation,
    shelter_bed_status_count_subquery,
    shelter_room_status_count_subquery,
)
from shelters.selectors import admin_bed_list, admin_reservation_list, admin_room_list, admin_shelter_list, shelter_list
from shelters.types.lookups import (
    AccessibilityType,
    CityType,
    ContactInfoType,
    DemographicType,
    EntryRequirementType,
    ExitPolicyType,
    FunderType,
    MedicalNeedType,
    ParkingType,
    PetType,
    ReferralRequirementType,
    RoomStyleType,
    ScheduleType,
    ServiceType,
    ShelterProgramType,
    ShelterTypeType,
    SPAType,
    SpecialSituationRestrictionType,
    StorageType,
    VaccinationRequirementType,
)
from strawberry import ID, Info, auto
from strawberry_django.auth.utils import get_current_user

from .filters import (
    BedFilter,
    BedOrder,
    ReservationFilter,
    ReservationOrder,
    RoomFilter,
    RoomOrder,
    ShelterFilter,
    ShelterOrder,
)


def _annotated_count(root: models.Shelter, name: str) -> int:
    value = getattr(root, name, None)
    return 0 if value is None else value


@strawberry.type
class ShelterLocationType:
    place: str
    latitude: float
    longitude: float


@strawberry_django.type(models.ShelterPhoto)
class ShelterPhotoType:
    id: ID
    type: ShelterPhotoTypeChoices
    created_at: datetime
    file: TransformableImageType


@strawberry.type
class ShelterPhotoUploadsType:
    photos: list[ShelterPhotoType]


@strawberry.type
class ShelterHeroImageType:
    id: ID
    url: str


@strawberry_django.type(models.MediaLink)
class MediaLinkType:
    id: ID
    url: str
    title: str
    media_type: auto


@strawberry_django.type(models.ShelterAvailability)
class ShelterAvailabilityType:
    id: ID
    non_restricted_beds: auto
    restricted_beds: auto
    restriction_notes: auto
    updated_at: auto


@strawberry.type
class BedsByStatusType:
    available: int = 0
    in_turnaround: int = 0
    occupied: int = 0
    out_of_service: int = 0
    reserved: int = 0


@strawberry.type
class RoomsByStatusType:
    available: int = 0
    in_turnaround: int = 0
    occupied: int = 0
    out_of_service: int = 0
    reserved: int = 0


@strawberry.type
class ShelterTypeMixin:
    id: ID
    accessibility: List[AccessibilityType]
    additional_contacts: List[ContactInfoType]
    add_notes_sleeping_details: Optional[str]
    add_notes_shelter_details: Optional[str]
    bed_fees: Optional[str]
    city: Optional[CityType]
    cities_served: List[CityType]
    city_council_district: auto
    curfew: auto
    demographics: List[DemographicType]
    demographics_other: auto
    description: str
    email: auto
    entry_info: Optional[str]
    entry_requirements: List[EntryRequirementType]
    exit_policy: List[ExitPolicyType]
    exit_policy_other: auto
    emergency_surge: auto
    funders: List[FunderType]
    funders_other: auto
    instagram: auto
    location: Optional[ShelterLocationType]
    max_stay: auto
    name: auto
    on_site_security: auto
    organization: Optional[OrganizationType]
    other_rules: Optional[str]
    other_services: Optional[str]
    overall_rating: auto
    parking: List[ParkingType]
    pets: List[PetType]
    phone: Optional[PhoneNumberScalar]  # type: ignore
    program_fees: Optional[str]
    referral_requirement: List[ReferralRequirementType]
    room_styles: List[RoomStyleType]
    room_styles_other: auto
    schedules: List[ScheduleType]
    services: List[ServiceType]
    shelter_programs: List[ShelterProgramType]
    shelter_programs_other: auto
    shelter_types: List[ShelterTypeType]
    shelter_types_other: auto
    spa: Optional[SPAType]
    spas_served: List[SPAType]
    special_situation_restrictions: List[SpecialSituationRestrictionType]
    photos: List[ShelterPhotoType]
    is_private: auto
    status: auto
    storage: List[StorageType]
    subjective_review: Optional[str]
    supervisorial_district: auto
    total_beds: auto
    updated_at: auto
    vaccination_requirement: List[VaccinationRequirementType]
    visitors_allowed: auto
    website: auto
    media_links: List[MediaLinkType]

    availability: Optional[ShelterAvailabilityType]

    _hero_photos: Optional[List[ShelterPhotoType]] = None

    @strawberry_django.field(
        only=["hero_image"],
        select_related=["hero_image"],
        prefetch_related=[
            lambda x: Prefetch(
                "photos",
                queryset=models.ShelterPhoto.objects.order_by("pk"),
                to_attr="_hero_photos",
            ),
        ],
    )
    def hero_image(
        self,
        root: models.Shelter,
        preset: Optional[ImagePresetEnum] = None,
        processing_options: Optional[str] = None,
    ) -> Optional[ShelterHeroImageType]:
        if photo := _get_hero_image(root):
            return ShelterHeroImageType(id=ID(str(photo.id)), url=build_img_url(photo.file, preset, processing_options))

        return None

    @strawberry_django.field
    def distance_in_miles(self, root: models.Shelter) -> Optional[float]:
        if distance := getattr(root, "distance", None):
            return float(distance.mi)

        return None

    @strawberry_django.field(
        annotate={
            "_bed_available": lambda info: shelter_bed_status_count_subquery(BedStatusChoices.AVAILABLE),
            "_bed_in_turnaround": lambda info: shelter_bed_status_count_subquery(BedStatusChoices.IN_TURNAROUND),
            "_bed_occupied": lambda info: shelter_bed_status_count_subquery(BedStatusChoices.OCCUPIED),
            "_bed_out_of_service": lambda info: shelter_bed_status_count_subquery(BedStatusChoices.OUT_OF_SERVICE),
            "_bed_reserved": lambda info: shelter_bed_status_count_subquery(BedStatusChoices.RESERVED),
        }
    )
    def beds_by_status(self, root: models.Shelter) -> BedsByStatusType:
        return BedsByStatusType(
            available=_annotated_count(root, "_bed_available"),
            in_turnaround=_annotated_count(root, "_bed_in_turnaround"),
            occupied=_annotated_count(root, "_bed_occupied"),
            out_of_service=_annotated_count(root, "_bed_out_of_service"),
            reserved=_annotated_count(root, "_bed_reserved"),
        )

    @strawberry_django.field(
        annotate={
            "_room_available": lambda info: shelter_room_status_count_subquery(RoomStatusChoices.AVAILABLE),
            "_room_in_turnaround": lambda info: shelter_room_status_count_subquery(RoomStatusChoices.IN_TURNAROUND),
            "_room_occupied": lambda info: shelter_room_status_count_subquery(RoomStatusChoices.OCCUPIED),
            "_room_out_of_service": lambda info: shelter_room_status_count_subquery(RoomStatusChoices.OUT_OF_SERVICE),
            "_room_reserved": lambda info: shelter_room_status_count_subquery(RoomStatusChoices.RESERVED),
        }
    )
    def rooms_by_status(self, root: models.Shelter) -> RoomsByStatusType:
        return RoomsByStatusType(
            available=_annotated_count(root, "_room_available"),
            in_turnaround=_annotated_count(root, "_room_in_turnaround"),
            occupied=_annotated_count(root, "_room_occupied"),
            out_of_service=_annotated_count(root, "_room_out_of_service"),
            reserved=_annotated_count(root, "_room_reserved"),
        )


@strawberry_django.type(models.Shelter, filters=ShelterFilter, ordering=ShelterOrder)
class ShelterType(ShelterTypeMixin):
    @classmethod
    def get_queryset(cls, queryset: QuerySet, info: Info) -> QuerySet[models.Shelter]:
        user = get_current_user(info)
        return shelter_list(queryset, user=user)


@strawberry_django.type(models.Shelter, filters=ShelterFilter, ordering=ShelterOrder)
class AdminShelterType(ShelterTypeMixin):
    @classmethod
    def get_queryset(cls, queryset: QuerySet, info: Info) -> QuerySet[models.Shelter]:
        user = cast(User, get_current_user(info))
        return admin_shelter_list(queryset, user=user)


def _get_hero_image(shelter: models.Shelter) -> Optional[models.ShelterPhoto]:
    if shelter.hero_image_id:
        return shelter.hero_image
    photos = getattr(shelter, "_hero_photos", [])
    return next((p for p in photos if p.type == ShelterPhotoTypeChoices.EXTERIOR), None) or next(
        (p for p in photos if p.type == ShelterPhotoTypeChoices.INTERIOR), None
    )


@strawberry_django.type(models.Bed, filters=BedFilter, ordering=BedOrder)
class BedType:
    @classmethod
    def get_queryset(cls, queryset: QuerySet, info: Info) -> QuerySet[models.Bed]:
        user = cast(User, get_current_user(info))
        return admin_bed_list(queryset, user=user)

    id: ID
    accessibility: List[AccessibilityType]
    b7: bool
    demographics: List[DemographicType]
    fees: Optional[int]
    funders: List[FunderType]
    last_cleaned_inspected: Optional[datetime]
    last_cleaned: Optional[datetime]
    maintenance_flag: bool
    medical_needs: List[MedicalNeedType]
    name: Optional[str]
    pets: List[PetType]
    room: Optional["RoomType"]
    shelter: "ShelterType"
    status_notes: Optional[str]
    storage: bool
    type: Optional[BedTypeChoices]

    @strawberry_django.field(
        annotate={"_computed_status": lambda info: bed_computed_status_annotation()},
    )
    def status(self, root: models.Bed) -> BedStatusChoices:
        return root.computed_status


@strawberry_django.type(models.Room, filters=RoomFilter, ordering=RoomOrder)
class RoomType:
    @classmethod
    def get_queryset(cls, queryset: QuerySet, info: Info) -> QuerySet[models.Room]:
        user = cast(User, get_current_user(info))
        return admin_room_list(queryset, user=user)

    id: ID
    accessibility: List[AccessibilityType]
    amenities: auto
    beds: List["BedType"]
    demographics: List[DemographicType]
    funders: List[FunderType]
    last_cleaned: auto
    last_cleaned_inspected: auto
    maintenance_flag: bool
    medical_respite: auto
    name: auto
    notes: auto
    pets: List[PetType]
    shelter: "ShelterType"
    storage: bool
    type: Optional[RoomStyleChoices]
    type_other: auto

    @strawberry_django.field(
        annotate={"_computed_status": lambda info: room_computed_status_annotation()},
    )
    def status(self, root: models.Room) -> RoomStatusChoices:
        return root.computed_status


@strawberry.type
class ReservationClientAssignmentType:
    client_profile_id: ID
    is_primary: bool


@strawberry_django.type(models.Reservation, filters=ReservationFilter, ordering=ReservationOrder)
class ReservationType:
    @classmethod
    def get_queryset(cls, queryset: QuerySet, info: Info) -> QuerySet[models.Reservation]:
        user = cast(User, get_current_user(info))
        return admin_reservation_list(queryset, user=user)

    id: ID
    bed: Optional["BedType"]
    checked_in_at: Optional[datetime]
    checked_out_at: Optional[datetime]
    duration: Optional[int]
    notes: Optional[str]
    room: Optional["RoomType"]
    start_date: Optional[date]
    status: ReservationStatusChoices

    @strawberry_django.field(select_related=["bed__shelter", "room__shelter"])
    def shelter(self, root: models.Reservation) -> "AdminShelterType":
        if root.bed:
            return cast("AdminShelterType", root.bed.shelter)

        if root.room is None:
            raise ValueError(f"Reservation {root.pk} has neither bed nor room assigned.")

        return cast("AdminShelterType", root.room.shelter)

    @strawberry_django.field(only=["created_by_id"])
    def created_by_id(self, root: models.Reservation) -> Optional[ID]:
        if root.created_by_id is None:
            return None
        return ID(str(root.created_by_id))

    @strawberry_django.field(prefetch_related=["reservation_clients"])
    def clients(self, root: models.Reservation) -> List[ReservationClientAssignmentType]:
        return [
            ReservationClientAssignmentType(
                client_profile_id=ID(str(rc.client_profile_id)),
                is_primary=rc.is_primary,
            )
            for rc in root.reservation_clients.all()
        ]

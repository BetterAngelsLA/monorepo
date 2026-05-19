"""Output types for shelter queries and mutations."""

from datetime import datetime
from typing import List, Optional, cast

import strawberry
import strawberry_django
from accounts.models import User
from accounts.types import OrganizationType
from common.enums import ImagePresetEnum
from common.graphql.types import PhoneNumberScalar, TransformableImageType
from common.imgproxy import build_imgproxy_url
from django.db.models import Count, Prefetch, Q, QuerySet
from shelters import models
from shelters.enums import (
    BedStatusChoices,
    BedTypeChoices,
    MedicalNeedChoices,
    RoomStatusChoices,
    RoomStyleChoices,
    ShelterPhotoTypeChoices,
)
from shelters.selectors import admin_shelter_list, shelter_list
from shelters.types.lookups import (
    AccessibilityType,
    CityType,
    ContactInfoType,
    DemographicType,
    EntryRequirementType,
    ExitPolicyType,
    FunderType,
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

from .filters import BedFilter, RoomFilter, ShelterFilter, ShelterOrder


@strawberry.type
class ShelterLocationType:
    place: str
    latitude: float
    longitude: float


@strawberry.type
class ShelterPhotoType:
    id: ID
    type: ShelterPhotoTypeChoices
    created_at: datetime
    file: TransformableImageType


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


@strawberry.type
class BedsByStatusType:
    available: int = 0
    occupied: int = 0
    reserved: int = 0
    out_of_service: int = 0


@strawberry.type
class ShelterTypeMixin:
    id: ID
    accessibility: List[AccessibilityType]
    additional_contacts: List[ContactInfoType]
    add_notes_sleeping_details: Optional[str]
    add_notes_shelter_details: Optional[str]
    bed_fees: Optional[str]
    city: Optional[CityType]
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
            if imgproxy_url := build_imgproxy_url(photo.file, preset, processing_options):
                return ShelterHeroImageType(id=ID(str(photo.id)), url=imgproxy_url)

        return None

    @strawberry_django.field
    def distance_in_miles(self, root: models.Shelter) -> Optional[float]:
        if distance := getattr(root, "distance", None):
            return float(distance.mi)

        return None

    @strawberry_django.field(
        annotate={
            "_bed_available": lambda info: Count("beds", filter=Q(beds__status=BedStatusChoices.AVAILABLE)),
            "_bed_occupied": lambda info: Count("beds", filter=Q(beds__status=BedStatusChoices.OCCUPIED)),
            "_bed_reserved": lambda info: Count("beds", filter=Q(beds__status=BedStatusChoices.RESERVED)),
            "_bed_out_of_service": lambda info: Count("beds", filter=Q(beds__status=BedStatusChoices.OUT_OF_SERVICE)),
        }
    )
    def beds_by_status(self, root: models.Shelter) -> BedsByStatusType:
        return BedsByStatusType(
            available=getattr(root, "_bed_available", 0),
            occupied=getattr(root, "_bed_occupied", 0),
            reserved=getattr(root, "_bed_reserved", 0),
            out_of_service=getattr(root, "_bed_out_of_service", 0),
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


@strawberry_django.type(models.Bed, filters=BedFilter)
class BedType:
    @classmethod
    def get_queryset(cls, queryset: QuerySet, info: Info) -> QuerySet[models.Bed]:
        user = cast(User, get_current_user(info))
        return queryset.filter(shelter__in=admin_shelter_list(models.Shelter.objects.all(), user=user))

    id: ID
    shelter: "ShelterType"
    room: Optional["RoomType"]
    bed_name: Optional[str]
    status: Optional[BedStatusChoices]
    status_notes: Optional[str]
    occupant_id: Optional[ID]
    bed_type: Optional[BedTypeChoices]
    demographics: List[DemographicType]
    accessibility: List[AccessibilityType]
    funders: List[FunderType]
    pets: List[PetType]
    storage: bool
    maintenance_flag: bool
    last_cleaned_inspected: Optional[datetime]
    medical_needs: Optional[MedicalNeedChoices]
    b7: bool
    fees: Optional[int]


@strawberry_django.type(models.Room, filters=RoomFilter)
class RoomType:
    @classmethod
    def get_queryset(cls, queryset: QuerySet, info: Info) -> QuerySet[models.Room]:
        user = cast(User, get_current_user(info))
        return queryset.filter(shelter__in=admin_shelter_list(models.Shelter.objects.all(), user=user))

    id: ID
    shelter: "ShelterType"
    room_identifier: auto
    room_type: Optional[RoomStyleChoices]
    room_type_other: auto
    status: Optional[RoomStatusChoices]
    notes: auto
    amenities: auto
    demographics: List[DemographicType]
    accessibility: List[AccessibilityType]
    funders: List[FunderType]
    pets: List[PetType]
    storage: bool
    maintenance_flag: bool
    medical_respite: auto
    last_cleaned_inspected: auto
    beds: List["BedType"]

    @strawberry_django.field
    def occupant_ids(self, root: models.Room) -> List[ID]:
        return cast(List[ID], [str(pk) for pk in root.occupants.values_list("pk", flat=True)])

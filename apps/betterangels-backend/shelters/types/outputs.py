"""Output types for shelter queries and mutations."""

from datetime import datetime
from itertools import chain
from typing import List, Optional, cast

import strawberry
import strawberry_django
from accounts.models import User
from accounts.types import OrganizationType
from common.graphql.types import PhoneNumberScalar, TransformableImageType
from common.imgproxy import build_imgproxy_url
from django.db.models import Count, Prefetch, Q, QuerySet
from shelters import models
from shelters.enums import BedStatusChoices, BedTypeChoices, MedicalNeedChoices, RoomStatusChoices, RoomStyleChoices
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
)
from strawberry import ID, Info, auto
from strawberry_django.auth.utils import get_current_user

from .filters import ShelterFilter, ShelterOrder


@strawberry.type
class ShelterLocationType:
    place: str
    latitude: float
    longitude: float


@strawberry.type
class ShelterPhotoType:
    id: ID
    created_at: datetime
    file: TransformableImageType


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
    cities: List[CityType]
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
    exterior_photos: List[ShelterPhotoType]
    funders: List[FunderType]
    funders_other: auto
    instagram: auto
    interior_photos: List[ShelterPhotoType]
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
    spa: List[SPAType]
    special_situation_restrictions: List[SpecialSituationRestrictionType]
    status: auto
    storage: List[StorageType]
    subjective_review: Optional[str]
    supervisorial_district: auto
    total_beds: auto
    updated_at: auto
    visitors_allowed: auto
    website: auto

    _exterior_photos: Optional[List[ShelterPhotoType]] = None
    _interior_photos: Optional[List[ShelterPhotoType]] = None

    # NOTE: This is a temporary workaround because Shelter specced without a hero image.
    # Will remove once we add a hero_image field to the Shelter model.
    @strawberry_django.field(
        only=["hero_image_content_type_id", "hero_image_object_id"],
        prefetch_related=[
            lambda x: Prefetch(
                "exterior_photos",
                queryset=models.ExteriorPhoto.objects.filter(),
                to_attr="_exterior_photos",
            ),
            lambda x: Prefetch(
                "interior_photos",
                queryset=models.InteriorPhoto.objects.filter(),
                to_attr="_interior_photos",
            ),
        ],
    )
    def hero_image(self, root: models.Shelter) -> Optional[str]:
        photo = next(
            filter(
                None,
                chain(
                    [getattr(root, "hero_image", None)],
                    self._exterior_photos or [],
                    self._interior_photos or [],
                ),
            ),
            None,
        )
        return build_imgproxy_url(photo.file, preset=None, processing_options=None) if photo else None

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
        return shelter_list(queryset)


@strawberry_django.type(models.Shelter, filters=ShelterFilter, ordering=ShelterOrder)
class AdminShelterType(ShelterTypeMixin):
    @classmethod
    def get_queryset(cls, queryset: QuerySet, info: Info) -> QuerySet[models.Shelter]:
        user = cast(User, get_current_user(info))
        return admin_shelter_list(queryset, user=user)


@strawberry_django.type(models.Bed)
class BedType:
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


@strawberry_django.type(models.Room)
class RoomType:
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

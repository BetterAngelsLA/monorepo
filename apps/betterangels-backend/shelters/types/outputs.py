"""Output types for shelter queries and mutations."""

from datetime import datetime
from itertools import chain
from typing import Any, List, Optional, cast

import strawberry
import strawberry_django
from accounts.models import User
from accounts.types import OrganizationType
from common.graphql.types import PhoneNumberScalar
from django.db.models import Prefetch, QuerySet
from shelters import models
from shelters.enums import BedStatusChoices, BedTypeChoices, MedicalNeedChoices
from shelters.selectors import admin_shelter_list, shelter_list
from shelters.types.lookups import (
    AccessibilityType,
    CityType,
    ContactInfoType,
    DemographicType,
    EntryRequirementType,
    FunderType,
    GeneralServiceType,
    HealthServiceType,
    ImmediateNeedType,
    ParkingType,
    PetType,
    RoomStyleType,
    ScheduleType,
    ShelterProgramType,
    ShelterTypeType,
    SPAType,
    SpecialSituationRestrictionType,
    StorageType,
    TrainingServiceType,
)
from strawberry import ID, Info, auto
from strawberry_django.auth.utils import get_current_user

from .filters import ShelterFilter, ShelterOrder


def _resolve_time_ranges(values: Any) -> Optional[List[Optional["TimeRange"]]]:
    """Convert model TimeRangeField values to a list of TimeRange output types."""
    if not values:
        return None
    return [TimeRange(start=start, end=end) if start is not None or end is not None else None for start, end in values]


@strawberry.type
class ShelterLocationType:
    place: str
    latitude: float
    longitude: float


@strawberry.type
class ShelterPhotoType:
    id: ID
    created_at: datetime
    file: strawberry_django.DjangoFileType


@strawberry.type
class TimeRange:
    start: Optional[datetime]
    end: Optional[datetime]


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
    exterior_photos: List[ShelterPhotoType]
    funders: List[FunderType]
    funders_other: auto
    general_services: List[GeneralServiceType]
    health_services: List[HealthServiceType]
    immediate_needs: List[ImmediateNeedType]
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
    room_styles: List[RoomStyleType]
    room_styles_other: auto
    schedules: List[ScheduleType]
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
    training_services: List[TrainingServiceType]
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
        return str(photo.file.url) if photo else None

    @strawberry_django.field
    def distance_in_miles(self, root: models.Shelter) -> Optional[float]:
        if distance := getattr(root, "distance", None):
            return float(distance.mi)

        return None

    @strawberry_django.field(only=["operating_hours"])
    def operating_hours(self, root: models.Shelter) -> Optional[List[Optional[TimeRange]]]:
        return _resolve_time_ranges(root.operating_hours)

    @strawberry_django.field(only=["intake_hours"])
    def intake_hours(self, root: models.Shelter) -> Optional[List[Optional[TimeRange]]]:
        return _resolve_time_ranges(root.intake_hours)


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

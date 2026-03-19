"""Input types for shelter mutations."""

from datetime import date, datetime, time
from typing import List, Optional

import strawberry
import strawberry_django
from common.graphql.types import PhoneNumberScalar
from shelters import models
from shelters.enums import (
    AccessibilityChoices,
    BedStatusChoices,
    BedTypeChoices,
    ConditionChoices,
    DayOfWeekChoices,
    DemographicChoices,
    EntryRequirementChoices,
    ExitPolicyChoices,
    FunderChoices,
    GeneralServiceChoices,
    HealthServiceChoices,
    ImmediateNeedChoices,
    MealServiceChoices,
    MedicalNeedChoices,
    ParkingChoices,
    PetChoices,
    ReferralRequirementChoices,
    RoomStatusChoices,
    RoomStyleChoices,
    ScheduleTypeChoices,
)
from shelters.enums import ShelterChoices as ShelterTypeChoices
from shelters.enums import (
    ShelterProgramChoices,
    SPAChoices,
    SpecialSituationRestrictionChoices,
    StorageChoices,
    TrainingServiceChoices,
)
from strawberry import ID, auto


@strawberry.input
class ShelterLocationInput:
    place: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None


@strawberry.input
class ScheduleInput:
    schedule_type: ScheduleTypeChoices = ScheduleTypeChoices.OPERATING
    days: Optional[List[DayOfWeekChoices]] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    condition: Optional[ConditionChoices] = None
    is_exception: bool = False


@strawberry_django.input(models.Shelter)
class CreateShelterInput:
    # Required scalars — derived from model via auto
    name: auto
    description: str  # CKEditor5Field not supported by auto

    # M2M enum fields — explicit types because we accept enum values directly
    # (get_or_create by name), not PKs as strawberry-django's ManyToManyInput expects.
    accessibility: List[AccessibilityChoices]
    demographics: List[DemographicChoices]
    special_situation_restrictions: List[SpecialSituationRestrictionChoices]
    shelter_types: List[ShelterTypeChoices]
    room_styles: List[RoomStyleChoices]
    storage: List[StorageChoices]
    pets: List[PetChoices]
    parking: List[ParkingChoices]
    immediate_needs: List[ImmediateNeedChoices]
    general_services: List[GeneralServiceChoices]
    health_services: List[HealthServiceChoices]
    training_services: List[TrainingServiceChoices]
    meal_services: List[MealServiceChoices]
    entry_requirements: List[EntryRequirementChoices]
    referral_requirement: List[ReferralRequirementChoices]
    exit_policy: List[ExitPolicyChoices]
    cities: List[str]
    spa: List[SPAChoices]
    shelter_programs: List[ShelterProgramChoices]
    funders: List[FunderChoices]

    # Custom field types — can't be auto-derived from Django model fields
    organization: ID
    location: Optional[ShelterLocationInput] = None
    schedules: Optional[List[ScheduleInput]] = None

    # Optional scalars — all model fields below have null=True, blank=True.
    # Using auto where strawberry-django can resolve the type; explicit types
    # for CKEditor5Field and PhoneNumberField which auto can't handle.
    email: auto = None
    phone: Optional[PhoneNumberScalar] = None  # PhoneNumberField
    website: auto = None
    instagram: auto = None
    status: auto = None
    demographics_other: auto = None
    shelter_types_other: auto = None
    total_beds: auto = None
    room_styles_other: auto = None
    add_notes_sleeping_details: Optional[str] = None  # CKEditor5Field
    add_notes_shelter_details: Optional[str] = None  # CKEditor5Field
    max_stay: auto = None
    curfew: auto = None
    on_site_security: auto = None
    visitors_allowed: auto = None
    exit_policy_other: auto = None
    emergency_surge: auto = None
    other_rules: Optional[str] = None  # CKEditor5Field
    other_services: Optional[str] = None  # CKEditor5Field
    entry_info: Optional[str] = None  # CKEditor5Field
    bed_fees: auto = None
    program_fees: auto = None
    shelter_programs_other: auto = None
    funders_other: auto = None
    subjective_review: Optional[str] = None  # CKEditor5Field
    city_council_district: auto = None
    supervisorial_district: auto = None
    overall_rating: auto = None


@strawberry.input
class CreateBedInput:
    shelter_id: ID
    status: Optional[BedStatusChoices] = None
    bed_name: Optional[str] = None
    status_notes: Optional[str] = None
    bed_type: Optional[BedTypeChoices] = None
    demographics: Optional[List[DemographicChoices]] = None
    accessibility: Optional[List[AccessibilityChoices]] = None
    funders: Optional[List[FunderChoices]] = None
    pets: Optional[List[PetChoices]] = None
    storage: Optional[bool] = None
    maintenance_flag: Optional[bool] = None
    last_cleaned_inspected: Optional[datetime] = None
    medical_needs: Optional[MedicalNeedChoices] = None
    b7: Optional[bool] = None
    fees: Optional[int] = None


@strawberry.input
class CreateRoomInput:
    shelter_id: ID
    room_identifier: str
    room_type: Optional[RoomStyleChoices] = None
    room_type_other: Optional[str] = None
    status: Optional[RoomStatusChoices] = None
    notes: Optional[str] = None
    amenities: Optional[str] = None
    medical_respite: Optional[bool] = False
    last_cleaned_inspected: Optional[datetime] = None

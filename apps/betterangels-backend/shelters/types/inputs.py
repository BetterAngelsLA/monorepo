"""Input types for shelter mutations."""

from datetime import time
from typing import List, Optional

import strawberry
import strawberry_django
from common.graphql.types import PhoneNumberScalar
from shelters import models
from shelters.enums import (
    AccessibilityChoices,
    DemographicChoices,
    EntryRequirementChoices,
    ExitPolicyChoices,
    FunderChoices,
    GeneralServiceChoices,
    HealthServiceChoices,
    ImmediateNeedChoices,
    MealServiceChoices,
    ParkingChoices,
    PetChoices,
    ReferralRequirementChoices,
    RoomStyleChoices,
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
class TimeRangeInput:
    start: Optional[time] = None
    end: Optional[time] = None


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
    operating_hours: Optional[List[TimeRangeInput]] = None
    intake_hours: Optional[List[TimeRangeInput]] = None

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

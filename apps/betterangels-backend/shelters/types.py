from typing import List, Optional

import strawberry
import strawberry_django
from common.graphql.types import PhoneNumberScalar
from shelters.enums import (
    AccessibilityChoices,
    CityChoices,
    DemographicChoices,
    EntryRequirementChoices,
    FunderChoices,
    GeneralServiceChoices,
    HealthServiceChoices,
    ImmediateNeedChoices,
    ParkingChoices,
    PetChoices,
    RoomStyleChoices,
    ShelterChoices,
    ShelterProgramChoices,
    SPAChoices,
    SpecialSituationRestrictionChoices,
    StorageChoices,
    TrainingServiceChoices,
)
from shelters.models import (
    SPA,
    Accessibility,
    City,
    ContactInfo,
    Demographic,
    EntryRequirement,
    Funder,
    GeneralService,
    HealthService,
    ImmediateNeed,
    Parking,
    Pet,
    RoomStyle,
    Shelter,
    ShelterProgram,
)
from shelters.models import ShelterType as ShelterKind
from shelters.models import SpecialSituationRestriction, Storage, TrainingService
from strawberry import ID, auto


@strawberry_django.type(ContactInfo)
class ContactInfoType:
    id: ID
    contact_name: auto
    contact_number: PhoneNumberScalar  # type: ignore


@strawberry.type
class ShelterLocationType:
    place: str
    latitude: float
    longitude: float


@strawberry_django.type(Demographic)
class DemographicType:
    name: Optional[DemographicChoices]


@strawberry_django.type(SpecialSituationRestriction)
class SpecialSituationRestrictionType:
    name: Optional[SpecialSituationRestrictionChoices]


@strawberry_django.type(ShelterKind)
class ShelterKindType:
    name: Optional[ShelterChoices]


@strawberry_django.type(RoomStyle)
class RoomStyleType:
    name: Optional[RoomStyleChoices]


@strawberry_django.type(Accessibility)
class AccessibilityType:
    name: Optional[AccessibilityChoices]


@strawberry_django.type(Storage)
class StorageType:
    name: Optional[StorageChoices]


@strawberry_django.type(Pet)
class PetType:
    name: Optional[PetChoices]


@strawberry_django.type(Parking)
class ParkingType:
    name: Optional[ParkingChoices]


@strawberry_django.type(ImmediateNeed)
class ImmediateNeedType:
    name: Optional[ImmediateNeedChoices]


@strawberry_django.type(GeneralService)
class GeneralServiceType:
    name: Optional[GeneralServiceChoices]


@strawberry_django.type(HealthService)
class HealthServiceType:
    name: Optional[HealthServiceChoices]


@strawberry_django.type(TrainingService)
class TrainingServiceType:
    name: Optional[TrainingServiceChoices]


@strawberry_django.type(EntryRequirement)
class EntryRequirementType:
    name: Optional[EntryRequirementChoices]


@strawberry_django.type(City)
class CityType:
    name: Optional[CityChoices]


@strawberry_django.type(SPA)
class SPAType:
    name: Optional[SPAChoices]


@strawberry_django.type(ShelterProgram)
class ShelterProgramType:
    name: Optional[ShelterProgramChoices]


@strawberry_django.type(Funder)
class FunderType:
    name: Optional[FunderChoices]


@strawberry_django.type(Shelter)
class ShelterType:
    id: ID
    accessibility: List[AccessibilityType]
    additional_contacts: List[ContactInfoType]
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
    funders: List[FunderType]
    funders_other: auto
    general_services: List[GeneralServiceType]
    health_services: List[HealthServiceType]
    immediate_needs: List[ImmediateNeedType]
    location: ShelterLocationType
    max_stay: auto
    name: auto
    on_site_security: auto
    organization: auto
    other_rules: Optional[str]
    other_services: Optional[str]
    overall_rating: auto
    parking: List[ParkingType]
    pets: List[PetType]
    phone: PhoneNumberScalar  # type: ignore
    program_fees: Optional[str]
    room_styles: List[RoomStyleType]
    room_styles_other: auto
    shelter_programs: List[ShelterProgramType]
    shelter_programs_other: auto
    shelter_types: List[ShelterKindType]
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

    @strawberry_django.field
    def hero_image(self, root: Shelter) -> Optional[str]:
        if exterior_photos := getattr(root, "prefetched_exterior_photos", None):
            return str(exterior_photos.first().file.url)

        if interior_photos := getattr(root, "prefetched_interior_photos", None):
            return str(interior_photos.first().file.url)

        return None

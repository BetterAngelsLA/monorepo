import datetime
import random
from enum import Enum
from typing import Any, Generic, TypeVar

from accounts.tests.baker_recipes import organization_recipe
from django.db.models import Model
from model_bakery import baker
from model_bakery.random_gen import gen_string
from model_bakery.recipe import Recipe, related, seq
from organizations.models import Organization
from places import Places
from shelters.enums import (
    CITY_COUNCIL_DISTRICT_CHOICES,
    SUPERVISORIAL_DISTRICT_CHOICES,
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
)
from shelters.enums import ShelterChoices as ShelterTypeChoices
from shelters.enums import (
    ShelterProgramChoices,
    SPAChoices,
    SpecialSituationRestrictionChoices,
    StatusChoices,
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
    ExteriorPhoto,
    Funder,
    GeneralService,
    HealthService,
    ImmediateNeed,
    InteriorPhoto,
    Parking,
    Pet,
    RoomStyle,
    Shelter,
    ShelterProgram,
    ShelterType,
    SpecialSituationRestriction,
    Storage,
    TrainingService,
    Video,
)

Model = TypeVar("Model")
T = TypeVar("T", bound=Enum)


def get_random_shelter_location() -> Places:
    street_names = ["Main St", "Santa Monica Blvd", "Wilshire Blvd", "Venice Blvd"]
    latitude_bounds = [33.937143, 34.102757]
    longitude_bounds = [-118.493372, -118.246635]

    random_address = f"{random.randint(100, 20000)} {random.choice(street_names)}"
    random_latitude = str(round(random.uniform(latitude_bounds[0], latitude_bounds[1]), 4))
    random_longitude = str(round(random.uniform(longitude_bounds[0], longitude_bounds[1]), 4))

    return Places(
        place=random_address,
        latitude=random_latitude,
        longitude=random_longitude,
    )


def get_random_phone_number() -> str:
    return f"212555{random.randint(1000, 9999)}"


class related_m2m_unique(related):
    def __init__(self, related_model: Model, choices_enum: Enum) -> None:
        self.related_model = related_model
        self.choices_enum = choices_enum

    def make(self) -> Any:
        related_objs = set()

        quantity = random.randint(0, len(self.choices_enum))

        for i in range(quantity):
            related_object, _ = self.related_model.objects.get_or_create(name=(list(self.choices_enum)[i]))
            related_objs.add(related_object)

        return related_objs

        # return [Accessibility.objects.get_or_create(name=AccessibilityChoices.WHEELCHAIR_ACCESSIBLE)[0]]


# # Main Shelter recipe with related objects
shelter_recipe = Recipe(
    Shelter,
    bed_fees=seq("bed fees "),
    city_council_district=random.choice(CITY_COUNCIL_DISTRICT_CHOICES)[0],
    curfew=datetime.time(random.randint(0, 23), random.randint(0, 59)),
    demographics_other=seq("demographics other "),
    description=seq("description "),
    email=seq("shelter", suffix="@example.com"),
    entry_info=seq("entry info "),
    funders_other=seq("funders other "),
    location=get_random_shelter_location(),
    max_stay=random.randint(1, 7),
    name=seq("shelter "),
    on_site_security=random.choice([True, False, None]),
    # organization=organization_recipe.make(name=seq("org ")),
    other_rules=seq("other rules "),
    other_services=seq("other services "),
    overall_rating=random.randint(1, 5),
    phone=get_random_phone_number(),
    program_fees=seq("program fees "),
    room_styles_other=seq("room styles other "),
    shelter_programs_other=seq("shelter programs other "),
    shelter_types_other=seq("shelter types other "),
    status=random.choice(list(StatusChoices)),
    subjective_review=seq("subjective review "),
    supervisorial_district=random.choice(SUPERVISORIAL_DISTRICT_CHOICES)[0],
    total_beds=random.randint(10, 100),
    website=seq("shelter", suffix=".com"),
    accessibility=related_m2m_unique(Accessibility, AccessibilityChoices),
    cities=related_m2m_unique(City, CityChoices),
    demographics=related_m2m_unique(Demographic, DemographicChoices),
    entry_requirements=related_m2m_unique(EntryRequirement, EntryRequirementChoices),
    funders=related_m2m_unique(Funder, FunderChoices),
    general_services=related_m2m_unique(GeneralService, GeneralServiceChoices),
    health_services=related_m2m_unique(HealthService, HealthServiceChoices),
    immediate_needs=related_m2m_unique(ImmediateNeed, ImmediateNeedChoices),
    parking=related_m2m_unique(Parking, ParkingChoices),
    pets=related_m2m_unique(Pet, PetChoices),
    room_styles=related_m2m_unique(RoomStyle, RoomStyleChoices),
    shelter_programs=related_m2m_unique(ShelterProgram, ShelterProgramChoices),
    shelter_types=related_m2m_unique(ShelterType, ShelterTypeChoices),
    spa=related_m2m_unique(SPA, SPAChoices),
    special_situation_restrictions=related_m2m_unique(SpecialSituationRestriction, SpecialSituationRestrictionChoices),
    storage=related_m2m_unique(Storage, StorageChoices),
    training_services=related_m2m_unique(TrainingService, TrainingServiceChoices),
)

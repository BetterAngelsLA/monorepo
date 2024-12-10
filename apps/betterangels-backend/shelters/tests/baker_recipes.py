import datetime
import random
from typing import Any

from accounts.tests.baker_recipes import organization_recipe
from model_bakery.recipe import Recipe, foreign_key, related, seq
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
    ShelterType,
    SpecialSituationRestriction,
    Storage,
    TrainingService,
)


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
    def __init__(self, related_model: Any, choices_enum: Any) -> None:
        self.related_model = related_model
        self.choices_enum = choices_enum

    def make(self) -> Any:
        related_objs = set()

        quantity = random.randint(0, len(self.choices_enum))

        for i in range(quantity):
            related_object, _ = self.related_model.objects.get_or_create(name=(list(self.choices_enum)[i]))
            related_objs.add(related_object)

        return related_objs


shelter_contact_recipe = Recipe(
    "ContactInfo",
    contact_name=seq("shelter contact "),  # type: ignore
    contact_number=get_random_phone_number,
)

shelter_recipe = Recipe(
    Shelter,
    bed_fees=seq("bed fees "),  # type: ignore
    city_council_district=random.choice(CITY_COUNCIL_DISTRICT_CHOICES)[0],
    curfew=datetime.time(random.randint(0, 23), random.randint(0, 59)),
    demographics_other=seq("demographics other "),  # type: ignore
    description=seq("description "),  # type: ignore
    email=seq("shelter", suffix="@example.com"),  # type: ignore
    entry_info=seq("entry info "),  # type: ignore
    funders_other=seq("funders other "),  # type: ignore
    location=get_random_shelter_location,
    max_stay=random.randint(1, 7),
    name=seq("shelter "),  # type: ignore
    organization=foreign_key(organization_recipe),
    on_site_security=random.choice([True, False, None]),
    other_rules=seq("other rules "),  # type: ignore
    other_services=seq("other services "),  # type: ignore
    overall_rating=random.randint(1, 5),
    phone=get_random_phone_number,
    program_fees=seq("program fees "),  # type: ignore
    room_styles_other=seq("room styles other "),  # type: ignore
    shelter_programs_other=seq("shelter programs other "),  # type: ignore
    shelter_types_other=seq("shelter types other "),  # type: ignore
    status=random.choice(list(StatusChoices)),
    subjective_review=seq("subjective review "),  # type: ignore
    supervisorial_district=random.choice(SUPERVISORIAL_DISTRICT_CHOICES)[0],
    total_beds=random.randint(10, 100),
    website=seq("shelter", suffix=".com"),  # type: ignore
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

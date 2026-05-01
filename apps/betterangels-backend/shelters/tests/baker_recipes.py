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
    DayOfWeekChoices,
    DemographicChoices,
    EntryRequirementChoices,
    ExitPolicyChoices,
    FunderChoices,
    ParkingChoices,
    PetChoices,
    ReferralRequirementChoices,
    RoomStyleChoices,
    ScheduleTypeChoices,
)
from shelters.enums import ShelterChoices as ShelterTypeChoices
from shelters.enums import (
    ShelterProgramChoices,
    SPAChoices,
    SpecialSituationRestrictionChoices,
    StatusChoices,
    StorageChoices,
)
from shelters.models import (
    SPA,
    Accessibility,
    City,
    Demographic,
    EntryRequirement,
    ExitPolicy,
    Funder,
    Parking,
    Pet,
    ReferralRequirement,
    RoomStyle,
    Schedule,
    Service,
    Shelter,
    ShelterProgram,
    ShelterType,
    SpecialSituationRestriction,
    Storage,
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
    def __init__(self, related_model: Any, choices_enum: Any, min_quantity: int = 0) -> None:
        self.related_model = related_model
        self.choices_enum = choices_enum
        self.min_quantity = min_quantity

    def make(self, **attrs: Any) -> Any:
        related_objs = set()
        choices = list(self.choices_enum)

        # limit to 5 related objects per type, for readability
        upper = min(len(choices), 5)
        lower = min(self.min_quantity, upper) if upper > 0 else 0
        quantity = random.randint(lower, upper) if upper > 0 else 0
        selected = random.sample(choices, quantity)

        for choice_value in selected:
            try:
                name_field = self.related_model._meta.get_field("name")
                if hasattr(name_field, "choices_enum"):
                    related_object, _ = self.related_model.objects.get_or_create(name=choice_value.value)
                else:
                    related_object, _ = self.related_model.objects.get_or_create(name=choice_value)
            except Exception:
                # Fallback: use choice value
                related_object, _ = self.related_model.objects.get_or_create(name=choice_value.value)
            related_objs.add(related_object)

        return related_objs


CITY_NAMES = ["Los Angeles", "Santa Monica", "Pasadena", "Long Beach", "Glendale", "Burbank"]


def get_or_create_city() -> City:
    """Return a random ``City`` reusing existing rows to respect the unique-name constraint."""
    city, _ = City.objects.get_or_create(name=random.choice(CITY_NAMES))
    return city


def get_or_create_spa() -> SPA:
    """Return a random ``City`` reusing existing rows to respect the unique-name constraint."""
    spa, _ = SPA.objects.get_or_create(name=random.choice(list(SPAChoices)))
    return spa


def make_services() -> list[Service]:
    """Pick a random subset of Service rows seeded by the data migration."""
    all_services = list(Service.objects.all())
    if not all_services:
        return []
    quantity = random.randint(1, min(len(all_services), 8))
    return random.sample(all_services, quantity)


shelter_contact_recipe = Recipe(
    "ContactInfo",
    contact_name=seq("shelter contact "),  # type: ignore
    contact_number=get_random_phone_number,
)

shelter_recipe = Recipe(
    Shelter,
    add_notes_shelter_details=seq("shelter details "),  # type: ignore
    add_notes_sleeping_details=seq("sleeping details "),  # type: ignore
    bed_fees=seq("bed fees "),  # type: ignore
    city_council_district=lambda: random.choice(CITY_COUNCIL_DISTRICT_CHOICES)[0],
    curfew=lambda: random.choice([datetime.time(random.randint(20, 23), 0), None]),
    demographics_other=seq("demographics other "),  # type: ignore
    description=seq("description "),  # type: ignore
    email=seq("shelter", suffix="@example.com"),  # type: ignore
    entry_info=seq("entry info "),  # type: ignore
    exit_policy_other=seq("exit policy other "),  # type: ignore
    funders_other=seq("funders other "),  # type: ignore
    location=get_random_shelter_location,
    max_stay=lambda: random.randint(7, 21),
    name=seq("shelter "),  # type: ignore
    organization=foreign_key(organization_recipe),
    on_site_security=random.choice([True, False, None]),
    visitors_allowed=random.choice([True, False, None]),
    emergency_surge=random.choice([True, False, None]),
    declined_ba_visit=random.choice([True, False]),
    instagram=lambda: random.choice(["https://instagram.com/shelter_example", None]),
    other_rules=seq("other rules "),  # type: ignore
    other_services=seq("other services "),  # type: ignore
    overall_rating=lambda: random.randint(1, 5),
    phone=get_random_phone_number,
    program_fees=seq("program fees "),  # type: ignore
    room_styles_other=seq("room styles other "),  # type: ignore
    shelter_programs_other=seq("shelter programs other "),  # type: ignore
    shelter_types_other=seq("shelter types other "),  # type: ignore
    status=lambda: random.choice(list(StatusChoices)),
    subjective_review=seq("subjective review "),  # type: ignore
    supervisorial_district=lambda: random.choice(SUPERVISORIAL_DISTRICT_CHOICES)[0],
    total_beds=lambda: round(random.randint(20, 200), -1),
    website=seq("shelter", suffix=".com"),  # type: ignore
    accessibility=related_m2m_unique(Accessibility, AccessibilityChoices, min_quantity=1),
    city=get_or_create_city,
    cities_served=related_m2m_unique(City, CITY_NAMES, min_quantity=1),
    demographics=related_m2m_unique(Demographic, DemographicChoices, min_quantity=1),
    entry_requirements=related_m2m_unique(EntryRequirement, EntryRequirementChoices, min_quantity=1),
    funders=related_m2m_unique(Funder, FunderChoices, min_quantity=1),
    parking=related_m2m_unique(Parking, ParkingChoices, min_quantity=1),
    pets=related_m2m_unique(Pet, PetChoices, min_quantity=1),
    room_styles=related_m2m_unique(RoomStyle, RoomStyleChoices, min_quantity=1),
    services=make_services,
    shelter_programs=related_m2m_unique(ShelterProgram, ShelterProgramChoices, min_quantity=1),
    shelter_types=related_m2m_unique(ShelterType, ShelterTypeChoices, min_quantity=1),
    spa=get_or_create_spa,
    spas_served=related_m2m_unique(SPA, SPAChoices, min_quantity=1),
    special_situation_restrictions=related_m2m_unique(
        SpecialSituationRestriction, SpecialSituationRestrictionChoices, min_quantity=1
    ),
    storage=related_m2m_unique(Storage, StorageChoices, min_quantity=1),
    exit_policy=related_m2m_unique(ExitPolicy, ExitPolicyChoices, min_quantity=1),
    referral_requirement=related_m2m_unique(ReferralRequirement, ReferralRequirementChoices, min_quantity=1),
)


# Fields that have corresponding ``<field>_other`` char fields.
FIELDS_WITH_OTHER = [
    "demographics",
    "shelter_types",
    "room_styles",
    "exit_policy",
    "shelter_programs",
    "funders",
]


def fix_other_fields(shelter: Shelter) -> None:
    """Set ``_other`` text only when the ``other`` value is in the M2M."""
    updates: list[str] = []
    for field_name in FIELDS_WITH_OTHER:
        other_attr = f"{field_name}_other"
        has_other = getattr(shelter, field_name).filter(name="other").exists()
        if has_other:
            setattr(shelter, other_attr, f"Custom {field_name.replace('_', ' ')} option")
        else:
            setattr(shelter, other_attr, None)
        updates.append(other_attr)
    shelter.save(update_fields=updates)


def make_schedules(shelter: Shelter, *, force_monday_exception: bool = False) -> None:
    """Create varied schedule patterns for a shelter."""
    all_days = list(DayOfWeekChoices)
    weekdays = [d for d in all_days if d not in {DayOfWeekChoices.SATURDAY, DayOfWeekChoices.SUNDAY}]

    is_24h = random.random() < 0.15

    # -- Operating hours --
    op_start_hour = random.choice([6, 7, 8, 9])
    op_end_hour = random.choice([16, 17, 18, 20, 22])
    op_days = weekdays if (not is_24h and random.random() < 0.3) else list(all_days)
    for day in op_days:
        is_weekend = day in {DayOfWeekChoices.SATURDAY, DayOfWeekChoices.SUNDAY}
        if is_24h:
            start, end = datetime.time(0, 0), datetime.time(23, 59)
        else:
            start = datetime.time(op_start_hour + (1 if is_weekend else 0), 0)
            end = datetime.time(op_end_hour, 0)
        Schedule.objects.create(
            shelter=shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=day,
            start_time=start,
            end_time=end,
            is_exception=False,
        )

    # -- Intake hours (random subset of days) --
    intake_days = random.sample(all_days, random.randint(3, 7))
    intake_start = datetime.time(random.choice([8, 9, 10]), 0)
    intake_end = datetime.time(random.choice([12, 14, 16]), 0)
    for day in intake_days:
        Schedule.objects.create(
            shelter=shelter,
            schedule_type=ScheduleTypeChoices.INTAKE,
            day=day,
            start_time=intake_start,
            end_time=intake_end,
            is_exception=False,
        )

    # -- Meal service (80 % of shelters) --
    if random.random() < 0.8:
        meal_windows = [
            (datetime.time(7, 0), datetime.time(8, 0)),
            (datetime.time(7, 30), datetime.time(8, 30)),
            (datetime.time(12, 0), datetime.time(13, 0)),
            (datetime.time(12, 30), datetime.time(13, 30)),
            (datetime.time(17, 0), datetime.time(18, 30)),
            (datetime.time(17, 30), datetime.time(18, 30)),
        ]
        selected_meals = random.sample(meal_windows, random.randint(1, 3))
        meal_days = random.sample(all_days, random.randint(5, 7))
        for day in meal_days:
            for start, end in selected_meals:
                Schedule.objects.create(
                    shelter=shelter,
                    schedule_type=ScheduleTypeChoices.MEAL_SERVICE,
                    day=day,
                    start_time=start,
                    end_time=end,
                    is_exception=False,
                )

    # -- Staff availability (70 % of shelters) --
    if random.random() < 0.7:
        staff_days = random.sample(all_days, random.randint(3, 6))
        staff_start = datetime.time(random.choice([8, 8, 9]), random.choice([0, 30]))
        staff_end = datetime.time(random.choice([16, 17]), random.choice([0, 30]))
        for day in staff_days:
            Schedule.objects.create(
                shelter=shelter,
                schedule_type=ScheduleTypeChoices.STAFF_AVAILABILITY,
                day=day,
                start_time=staff_start,
                end_time=staff_end,
                is_exception=False,
            )

    # -- Exception days --
    if force_monday_exception:
        exception_days = [DayOfWeekChoices.MONDAY]
    else:
        exception_days = random.sample(all_days, k=random.randint(0, 3))
    for day in exception_days:
        Schedule.objects.create(
            shelter=shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=day,
            start_time=None,
            end_time=None,
            is_exception=True,
            start_date=None,
            end_date=None,
        )


def make_complete_shelters(**kwargs: Any) -> list[Shelter]:
    """Create shelters with fix_other_fields and schedules applied.

    Accepts the same keyword arguments as ``shelter_recipe.make()``.
    Always returns a list, even when ``_quantity`` is 1.
    """
    result = shelter_recipe.make(**kwargs)
    shelters = result if isinstance(result, list) else [result]
    for idx, shelter in enumerate(shelters):
        fix_other_fields(shelter)
        make_schedules(shelter, force_monday_exception=(idx == 0))
    return shelters

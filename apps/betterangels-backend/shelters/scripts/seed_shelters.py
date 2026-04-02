import datetime
import os
import random
import sys
from pathlib import Path
from typing import Any

"""Seed shelters with representative demo data.

Usage:
    python seed_shelters.py <number_of_shelters> [--clear]

This script creates approved shelters with all required fields populated,
randomized multi-select values, 1–10 photos (exterior + interior), varied
schedules, contacts, and proper handling of "_other" text fields.  It is
designed to exercise as many field combinations as possible so local and dev
environments surface realistic UI coverage.
"""

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "betterangels_backend.settings")
import django  # noqa: E402
from django.core.files import File  # noqa: E402
from django.db import transaction  # noqa: E402

django.setup()

from django.contrib.contenttypes.models import ContentType  # noqa: E402
from shelters.enums import (  # noqa: E402
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
from shelters.enums import ShelterChoices as ShelterTypeChoices  # noqa: E402
from shelters.enums import (  # noqa: E402
    ShelterProgramChoices,
    SPAChoices,
    SpecialSituationRestrictionChoices,
    StatusChoices,
    StorageChoices,
)
from shelters.models import (  # noqa: E402
    SPA,
    Accessibility,
    City,
    Demographic,
    EntryRequirement,
    ExitPolicy,
    ExteriorPhoto,
    Funder,
    InteriorPhoto,
    Parking,
    Pet,
    ReferralRequirement,
    RoomStyle,
    Service,
    Shelter,
    ShelterProgram,
    ShelterType,
    SpecialSituationRestriction,
    Storage,
)
from shelters.models.schedule import Schedule  # noqa: E402
from shelters.tests.baker_recipes import shelter_contact_recipe, shelter_recipe  # noqa: E402

# ---------------------------------------------------------------------------
# M2M field definitions – model class, enum, and whether "other" text exists
# ---------------------------------------------------------------------------
M2M_FIELDS: list[tuple[str, Any, Any]] = [
    ("demographics", Demographic, DemographicChoices),
    ("special_situation_restrictions", SpecialSituationRestriction, SpecialSituationRestrictionChoices),
    ("shelter_types", ShelterType, ShelterTypeChoices),
    ("room_styles", RoomStyle, RoomStyleChoices),
    ("accessibility", Accessibility, AccessibilityChoices),
    ("storage", Storage, StorageChoices),
    ("pets", Pet, PetChoices),
    ("parking", Parking, ParkingChoices),
    ("exit_policy", ExitPolicy, ExitPolicyChoices),
    ("entry_requirements", EntryRequirement, EntryRequirementChoices),
    ("referral_requirement", ReferralRequirement, ReferralRequirementChoices),
    ("spa", SPA, SPAChoices),
    ("shelter_programs", ShelterProgram, ShelterProgramChoices),
    ("funders", Funder, FunderChoices),
]

# Fields that have corresponding ``<field>_other`` char fields.
FIELDS_WITH_OTHER = [
    "demographics",
    "shelter_types",
    "room_styles",
    "exit_policy",
    "shelter_programs",
    "funders",
]

CITY_NAMES = [
    "Los Angeles",
    "Santa Monica",
    "Pasadena",
    "Long Beach",
    "Glendale",
    "Burbank",
    "Culver City",
    "Inglewood",
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _get_or_create_lookup(model: Any, choices_enum: type, value: Any) -> Any:
    """Get or create a lookup model instance for a given enum value."""
    name_field = model._meta.get_field("name")
    if hasattr(name_field, "choices_enum"):
        obj, _ = model.objects.get_or_create(name=value.value)
    else:
        obj, _ = model.objects.get_or_create(name=value)
    return obj


def _ensure_m2m_populated(shelter: Shelter) -> None:
    """Guarantee every M2M field has at least one value (random selection)."""
    for field_name, model, choices_enum in M2M_FIELDS:
        m2m_manager = getattr(shelter, field_name)
        if m2m_manager.count() == 0:
            choices: list[Any] = list(choices_enum)
            count = random.randint(1, min(len(choices), 5))
            for choice in random.sample(choices, count):
                m2m_manager.add(_get_or_create_lookup(model, choices_enum, choice))


def _fix_other_fields(shelter: Shelter) -> None:
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


def _add_images(shelter: Shelter, django_file: File, total: int) -> None:
    """Create a mix of exterior and interior photos; set the hero image."""
    num_exterior = random.randint(1, total)
    num_interior = total - num_exterior

    first_exterior = None
    for _ in range(num_exterior):
        photo = ExteriorPhoto.objects.create(file=django_file, shelter=shelter)
        if first_exterior is None:
            first_exterior = photo

    for _ in range(num_interior):
        InteriorPhoto.objects.create(file=django_file, shelter=shelter)

    # Set hero image to the first exterior photo.
    if first_exterior:
        ct = ContentType.objects.get_for_model(ExteriorPhoto)
        shelter.hero_image_content_type = ct
        shelter.hero_image_object_id = first_exterior.pk
        shelter.save(update_fields=["hero_image_content_type", "hero_image_object_id"])


def _randomize_schedules(shelter: Shelter, *, force_monday_exception: bool = False) -> None:
    """Create varied schedule patterns per shelter."""
    all_days = list(DayOfWeekChoices)
    weekdays = [d for d in all_days if d not in {DayOfWeekChoices.SATURDAY, DayOfWeekChoices.SUNDAY}]

    is_24h = random.random() < 0.15

    # -- Operating hours --
    op_start_hour = random.choice([6, 7, 8, 9])
    op_end_hour = random.choice([16, 17, 18, 20, 22])
    # Some shelters closed on weekends
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


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> None:
    if len(sys.argv) not in {2, 3}:
        print("Usage: python seed_shelters.py <number_of_shelters> [--clear]")
        sys.exit(1)

    try:
        num_shelters = int(sys.argv[1])
    except ValueError:
        print("The number of shelters must be an integer.")
        sys.exit(1)

    clear_existing = len(sys.argv) == 3 and sys.argv[2] == "--clear"
    if len(sys.argv) == 3 and not clear_existing:
        print("Usage: python seed_shelters.py <number_of_shelters> [--clear]")
        sys.exit(1)

    with transaction.atomic():
        if clear_existing:
            print("Clearing existing shelters...")
            Shelter.objects.all().delete()

        print(f"Generating {num_shelters} shelters...")
        shelters = shelter_recipe.make(
            _quantity=num_shelters,
            _fill_optional=True,
            status=StatusChoices.APPROVED,
            hero_image_content_type=None,
            hero_image_object_id=None,
        )

        # ---- Per-shelter field randomisation ----
        name_max_length = Shelter._meta.get_field("name").max_length or 255
        long_name = ("VeryLongShelterName" * 25)[:name_max_length]

        for idx, shelter in enumerate(shelters):
            # ~15 % of shelters get an unbreakable long name
            if random.random() < 0.15:
                shelter.name = long_name

            # Randomise booleans per shelter
            shelter.on_site_security = random.choice([True, False, None])
            shelter.visitors_allowed = random.choice([True, False, None])
            shelter.emergency_surge = random.choice([True, False, None])
            shelter.declined_ba_visit = random.choice([True, False])

            # Instagram (40 % of shelters)
            if random.random() < 0.4:
                shelter.instagram = f"https://instagram.com/shelter{idx}"
            else:
                shelter.instagram = None

            shelter.save()

            # Ensure every M2M field has ≥ 1 value
            _ensure_m2m_populated(shelter)

            # Only set _other text when "other" is actually selected
            _fix_other_fields(shelter)

            # Ensure cities
            if shelter.cities.count() == 0:
                city, _ = City.objects.get_or_create(name=random.choice(CITY_NAMES))
                shelter.cities.add(city)

            # Ensure services
            if shelter.services.count() == 0:
                all_services = list(Service.objects.all())
                if all_services:
                    count = random.randint(1, min(len(all_services), 8))
                    shelter.services.add(*random.sample(all_services, count))

        # ---- Images (1–10 per shelter) ----
        image_path = Path(__file__).with_name("shelter_seed_image.png")
        with image_path.open("rb") as image_file:
            django_file = File(image_file)
            for shelter in shelters:
                _add_images(shelter, django_file, total=random.randint(1, 10))

        # ---- Contacts (1–3 per shelter) ----
        for shelter in shelters:
            for _ in range(random.randint(1, 3)):
                shelter_contact_recipe.make(shelter=shelter)

        # ---- Schedules (varied per shelter) ----
        for idx, shelter in enumerate(shelters):
            _randomize_schedules(
                shelter,
                force_monday_exception=(idx == 0),
            )

        print(f"Successfully created {num_shelters} shelters with all required fields.")


if __name__ == "__main__":
    main()

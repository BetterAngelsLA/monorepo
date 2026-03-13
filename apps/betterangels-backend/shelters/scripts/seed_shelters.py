import datetime
import os
import random
import sys
from pathlib import Path

"""Seed shelters with representative demo data.

Usage:
    python seed_shelters.py <number_of_shelters> [--clear]

This script creates approved shelters with placeholder exterior photos,
random contacts, multiple schedule types, and a small set of operating
exceptions so the shelter detail UI and Open Now filtering have predictable
demo coverage.
"""

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "betterangels_backend.settings")
import django  # noqa: E402
from django.core.files import File  # noqa: E402
from django.db import transaction  # noqa: E402

django.setup()

from shelters.enums import (  # noqa: E402
    DayOfWeekChoices,
    ScheduleTypeChoices,
    StatusChoices,
)
from shelters.models import ExteriorPhoto, Shelter  # noqa: E402
from shelters.models.schedule import Schedule  # noqa: E402
from shelters.tests.baker_recipes import (  # noqa: E402
    shelter_contact_recipe,
    shelter_recipe,
)


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

        image_path = Path(__file__).with_name("shelter_seed_image.png")
        with image_path.open("rb") as image_file:
            django_file = File(image_file)
            for shelter in shelters:
                ExteriorPhoto.objects.create(file=django_file, shelter=shelter)

        # add contacts
        for shelter in shelters:
            for _ in range(random.randint(0, 3)):
                shelter_contact_recipe.make(shelter=shelter)

        # Add a representative mix of schedule types so seeded shelters exercise
        # the multi-pill hours UI in the detail modal.
        for shelter in shelters:
            # Operating hours: daily with a longer weekday window.
            for day in DayOfWeekChoices:
                is_weekend = day in {DayOfWeekChoices.SATURDAY, DayOfWeekChoices.SUNDAY}
                Schedule.objects.create(
                    **{
                        "shelter": shelter,
                        "schedule_type": ScheduleTypeChoices.OPERATING,
                        "day": day,
                        "start_time": datetime.time(9, 0) if is_weekend else datetime.time(8, 0),
                        "end_time": datetime.time(16, 0) if is_weekend else datetime.time(18, 0),
                        "is_exception": False,
                    }
                )

            # Intake hours: weekdays only.
            for day in [
                DayOfWeekChoices.MONDAY,
                DayOfWeekChoices.TUESDAY,
                DayOfWeekChoices.WEDNESDAY,
                DayOfWeekChoices.THURSDAY,
                DayOfWeekChoices.FRIDAY,
            ]:
                Schedule.objects.create(
                    **{
                        "shelter": shelter,
                        "schedule_type": ScheduleTypeChoices.INTAKE,
                        "day": day,
                        "start_time": datetime.time(10, 0),
                        "end_time": datetime.time(14, 0),
                        "is_exception": False,
                    }
                )

            # Meal service: breakfast and dinner every day.
            for day in DayOfWeekChoices:
                Schedule.objects.create(
                    **{
                        "shelter": shelter,
                        "schedule_type": ScheduleTypeChoices.MEAL_SERVICE,
                        "day": day,
                        "start_time": datetime.time(7, 30),
                        "end_time": datetime.time(8, 30),
                        "is_exception": False,
                    }
                )
                Schedule.objects.create(
                    **{
                        "shelter": shelter,
                        "schedule_type": ScheduleTypeChoices.MEAL_SERVICE,
                        "day": day,
                        "start_time": datetime.time(17, 30),
                        "end_time": datetime.time(18, 30),
                        "is_exception": False,
                    }
                )

            # Staff availability: weekday business hours.
            for day in [
                DayOfWeekChoices.MONDAY,
                DayOfWeekChoices.TUESDAY,
                DayOfWeekChoices.WEDNESDAY,
                DayOfWeekChoices.THURSDAY,
                DayOfWeekChoices.FRIDAY,
            ]:
                Schedule.objects.create(
                    **{
                        "shelter": shelter,
                        "schedule_type": ScheduleTypeChoices.STAFF_AVAILABILITY,
                        "day": day,
                        "start_time": datetime.time(8, 30),
                        "end_time": datetime.time(17, 0),
                        "is_exception": False,
                    }
                )

            # Add full-day operating exceptions for 1–2 unique days.
            # Keep the first shelter's exception on Monday so demo data always
            # includes at least one predictable "closed by exception" shelter
            # for the Open Now filter and operating-hours UI.
            if shelter is shelters[0]:
                exception_days = [DayOfWeekChoices.MONDAY]
            else:
                exception_days = random.sample(
                    list(DayOfWeekChoices),
                    k=random.randint(1, 2),
                )
            for day in exception_days:
                Schedule.objects.create(
                    **{
                        "shelter": shelter,
                        "schedule_type": ScheduleTypeChoices.OPERATING,
                        "day": day,
                        "start_time": None,
                        "end_time": None,
                        "is_exception": True,
                        "start_date": None,
                        "end_date": None,
                    }
                )


if __name__ == "__main__":
    main()

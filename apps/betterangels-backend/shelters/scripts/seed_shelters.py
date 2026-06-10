import os
import random
import sys
from pathlib import Path

import django
from django.core.files import File
from django.db import transaction
from faker import Faker

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
django.setup()

from shelters.enums import ShelterPhotoTypeChoices, StatusChoices  # noqa: E402
from shelters.models import Shelter, ShelterPhoto  # noqa: E402
from shelters.tests.baker_recipes import make_complete_shelters, shelter_contact_recipe  # noqa: E402

fake = Faker()

# Maximum allowed length for a generated shelter name (excludes the " id-N" suffix)
SHELTER_NAME_MAX_LENGTH = 80

# Probability that a generated name targets the "long" bucket (>70 chars). Long
# names are rare in production but must be prominent in dev so UI can handle them.
LONG_NAME_PROBABILITY = 0.10

# Suffixes that make a randomly generated name read like a real shelter.
_SHELTER_SUFFIXES = [
    "Shelter",
    "House",
    "Refuge",
    "Mission",
    "Sanctuary",
    "Center",
    "Haven",
    "Outreach",
    "Lodge",
    "Place",
]

# Qualifiers paired with a person's last name to mimic real shelter naming patterns.
_NAME_QUALIFIERS = ["Memorial", "Family", "Community", "Foundation"]


def generate_shelter_name() -> str:
    """Return a plausible shelter name with controlled length variability.

    Names are built as ``<last-name>[ & <last-name>...] <qualifier> <suffix>``,
    which mirrors real partnership/coalition shelter naming. A small fraction
    (see :data:`LONG_NAME_PROBABILITY`) intentionally targets the long bucket
    (>70 chars, up to :data:`SHELTER_NAME_MAX_LENGTH`) so dev/UI workflows must
    handle extreme cases. The rest are normal-length (~15-50 chars).
    """
    if random.random() < LONG_NAME_PROBABILITY:
        target = random.randint(71, SHELTER_NAME_MAX_LENGTH)
    else:
        target = random.randint(15, 50)

    qualifier = random.choice(_NAME_QUALIFIERS)
    suffix = random.choice(_SHELTER_SUFFIXES)
    joiner = random.choice([" & ", " - "])
    tail = f" {qualifier} {suffix}"

    # Keep chaining last names while the projected total stays within target.
    last_names: list[str] = [fake.last_name()]

    while True:
        candidate = fake.last_name()
        projected = len(joiner.join(last_names + [candidate])) + len(tail)
        if projected > target:
            break
        last_names.append(candidate)

    name = f"{joiner.join(last_names)}{tail}"
    # Defensive cap: never exceed the hard limit, even if a single last name is huge.
    if len(name) > SHELTER_NAME_MAX_LENGTH:
        name = name[:SHELTER_NAME_MAX_LENGTH].rsplit(" ", 1)[0]

    return name


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _add_images(shelter: Shelter, django_file: File, total: int) -> None:
    """Create a mix of exterior and interior photos; set the hero image."""
    num_exterior = random.randint(1, total)
    num_interior = total - num_exterior

    first_exterior = None
    for _ in range(num_exterior):
        photo = ShelterPhoto.objects.create(file=django_file, shelter=shelter, type=ShelterPhotoTypeChoices.EXTERIOR)
        if first_exterior is None:
            first_exterior = photo

    for _ in range(num_interior):
        ShelterPhoto.objects.create(file=django_file, shelter=shelter, type=ShelterPhotoTypeChoices.INTERIOR)

    # Set hero image to the first exterior photo.
    if first_exterior:
        shelter.hero_image = first_exterior
        shelter.save(update_fields=["hero_image"])


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
        shelters = make_complete_shelters(
            _quantity=num_shelters,
            _fill_optional=True,
            status=StatusChoices.APPROVED,
            hero_image=None,
        )

        # ---- Generate human readable shelter name name with a DB ID suffix
        # Prefix length is randomized to surface UI breakage on unusually short/long names.
        for shelter in shelters:
            shelter.name = f"{generate_shelter_name()} (id-{shelter.id})"

        Shelter.objects.bulk_update(shelters, ["name"])

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

        print(f"Successfully created {num_shelters} shelters with all required fields.")


if __name__ == "__main__":
    main()

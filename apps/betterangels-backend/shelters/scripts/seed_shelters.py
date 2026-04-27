import os
import random
import sys
from pathlib import Path

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
from shelters.enums import StatusChoices  # noqa: E402
from shelters.models import ExteriorPhoto, InteriorPhoto, Shelter  # noqa: E402
from shelters.tests.baker_recipes import make_complete_shelters, shelter_contact_recipe  # noqa: E402


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
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
            hero_image_content_type=None,
            hero_image_object_id=None,
        )

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

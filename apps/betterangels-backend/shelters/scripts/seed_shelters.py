import os
import random
import sys

import django
from django.core.files import File
from django.db import transaction

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "betterangels_backend.settings")
django.setup()


"""
Script to seed the database with a specified number of shelters and associated data.

Usage:
    python seed_shelters.py <number_of_shelters>

Arguments:
    <number_of_shelters> : An integer specifying the number of shelters to generate.

Details:
- Generates shelters using the `shelter_recipe` defined in `baker_recipes`.
- Adds a between 0 and 3 contacts to each shelter using `shelter_contact_recipe`.
- Adds a placeholder image to each shelter using colocated stock image.

Dependencies:
- The `shelter_seed_image.png` file must exist in the script's directory.

Example:
    python seed_shelters.py 10
    This generates 10 shelters with associated placeholder images and random contacts.

Note:
- cd to script's directory before running.
- Make sure you've run migrations.
"""


def main() -> None:
    from shelters.models import ExteriorPhoto
    from shelters.tests.baker_recipes import shelter_contact_recipe, shelter_recipe

    if len(sys.argv) != 2:
        print("Usage: python seed_shelters.py <number_of_shelters>")
        sys.exit(1)

    try:
        num_shelters = int(sys.argv[1])
    except ValueError:
        print("The number of shelters must be an integer.")
        sys.exit(1)

    with transaction.atomic():
        print(f"Generating {num_shelters} shelters...")
        shelters = shelter_recipe.make(_quantity=num_shelters, _fill_optional=True)

        with open("./shelter_seed_image.png", "rb") as image_file:
            django_file = File(image_file)

            for shelter in shelters:
                ExteriorPhoto.objects.create(file=django_file, shelter=shelter)

        # add contacts
        for shelter in shelters:
            for _ in range(random.randint(0, 3)):
                shelter_contact_recipe.make(shelter=shelter)


if __name__ == "__main__":
    main()

"""Seed data for notes (OrganizationService + Categories).

Replaces RunPython data migrations. Called by:

* ``post_migrate`` signal (production & local dev)
* ``conftest.py`` session fixture (CI / ``--no-migrations``)
* ``manage.py seed_data`` management command (manual)

Uses ``get_or_create`` throughout — idempotent, safe to re-run.
"""

from logging import getLogger

from django.db import transaction
from organizations.models import Organization

from notes.enums import ServiceEnum
from notes.models import OrganizationService, OrganizationServiceCategory

logger = getLogger(__name__)

DEFAULT_ORG_NAME = "Better Angels"

SERVICE_CATEGORIES = [
    (
        "Immediate Needs",
        [
            "Food",
            "Water",
            "Bag(s)",
            "Batteries",
            "Blanket",
            "Book",
            "Clothes",
            "Feminine Hygiene",
            "First Aid",
            "Hygiene Kit",
            "Pet Food",
            "Shoes",
            "Shower",
            "Sleeping Bag",
            "Tarp",
            "Tent",
        ],
    ),
    (
        "Communication",
        [
            "Mail Pick Up",
            "California Lifeline Phone",
            "Internet Access",
            "LAHOP",
            "HMIS Consent",
            "Consent to Connect (CM or Council District)",
        ],
    ),
    (
        "Identity",
        [
            "Birth Certificate",
            "DMV No Fee ID Form",
            "Social Security Card Replacement",
        ],
    ),
    (
        "Income",
        [
            "Stimulus Assistance",
            "EBT",
            "SSI/SSDI",
            "Public Benefits Programs",
            "Medi-Cal",
            "Unemployment Certification",
        ],
    ),
    (
        "Housing",
        [
            "Shelter",
            "Storage - Documents",
            "Storage - Belongings",
            "Safe Parking",
        ],
    ),
    (
        "Medical",
        [
            "Dental",
            "Harm Reduction",
            "Medical",
            "Pet Care",
            "Vaccine Passport",
        ],
    ),
    (
        "Mental",
        [
            "DMH Evaluation",
            "Therapist Appointment",
        ],
    ),
    (
        "Social",
        [
            "Family Reunification",
            "Contact Friend",
        ],
    ),
    (
        "Transportation",
        [
            "Metro LIFE Tap",
            "Discount Scooter Rides",
            "Ride",
            "Bicycle",
            "Bicycle Repair",
        ],
    ),
    (
        "Legal",
        [
            "Contact DPSS",
            "Legal Counsel",
            "Notary",
        ],
    ),
]


@transaction.atomic
def seed_organization_services() -> None:
    """Ensure all OrganizationService rows exist with correct categories."""

    org, _ = Organization.objects.get_or_create(name=DEFAULT_ORG_NAME)

    for cat_idx, (cat_name, service_labels) in enumerate(SERVICE_CATEGORIES):
        category, created = OrganizationServiceCategory.objects.get_or_create(
            name=cat_name,
            defaults={"organization": org, "priority": cat_idx},
        )
        if created:
            logger.info("Created OrganizationServiceCategory: %s", cat_name)

        for svc_idx, label in enumerate(service_labels):
            _, created = OrganizationService.objects.get_or_create(
                label=label,
                defaults={
                    "organization": org,
                    "category": category,
                    "priority": svc_idx,
                },
            )
            if created:
                logger.info("Created OrganizationService: %s", label)

    # Catch any ServiceEnum values not explicitly categorized (e.g. "Other")
    for service_enum in ServiceEnum:
        _, created = OrganizationService.objects.get_or_create(
            label=service_enum.label,
            defaults={"organization": org},
        )
        if created:
            logger.info(
                "Created uncategorized OrganizationService: %s",
                service_enum.label,
            )

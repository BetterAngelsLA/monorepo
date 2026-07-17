"""Seed data for notes (OrganizationService + Categories).

Replaces RunPython data migrations. Called by:

* ``post_migrate`` signal (production & local dev)
* ``conftest.py`` session fixture (CI)

Uses ``get_or_create`` throughout — idempotent, safe to re-run.
"""

from logging import getLogger

from django.db import transaction
from organizations.models import Organization

from notes.enums import ServiceEnum
from notes.models import OrganizationService, OrganizationServiceCategory

logger = getLogger(__name__)

# The old migration 0022 seeded ~52 services under 10 categories.
# Tests .get(label=...) these services, so every ServiceEnum value must exist.
# We create a default org + category, then one OrganizationService per enum value.

DEFAULT_ORG_NAME = "Better Angels"
DEFAULT_CATEGORY_NAME = "General"


@transaction.atomic
def seed_organization_services() -> None:
    """Ensure all OrganizationService rows exist for tests."""
    org, _ = Organization.objects.get_or_create(name=DEFAULT_ORG_NAME)
    category, _ = OrganizationServiceCategory.objects.get_or_create(
        name=DEFAULT_CATEGORY_NAME,
        defaults={"organization": org},
    )

    created_count = 0
    for service_enum in ServiceEnum:
        _, created = OrganizationService.objects.get_or_create(
            label=service_enum.label,
            defaults={
                "organization": org,
                "category": category,
            },
        )
        if created:
            created_count += 1
    if created_count:
        logger.info("Created %d OrganizationService rows", created_count)

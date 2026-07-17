"""Seed data for shelter lookups (SPAs) and legacy auth groups.

Replaces RunPython data migrations. Called by post_migrate signal.
"""

from logging import getLogger

from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType

from shelters.models.lookups import SPA

logger = getLogger(__name__)

SPA_DATA = [
    (1, "1", "1 - Antelope Valley"),
    (2, "2", "2 - San Fernando"),
    (3, "3", "3 - San Gabriel"),
    (4, "4", "4 - Metro"),
    (5, "5", "5 - West"),
    (6, "6", "6 - South"),
    (7, "7", "7 - East"),
    (8, "8", "8 - South Bay/Harbor"),
]

# Models that both Shelter Data Entry and Shelter Administration groups
# get full CRUD permissions on (matching the original migration).
_SHARED_PERMISSION_MODELS = (
    "accessibility",
    "city",
    "contactinfo",
    "demographic",
    "entryrequirement",
    "exitpolicy",
    "funder",
    "medialink",
    "parking",
    "pet",
    "referralrequirement",
    "roomstyle",
    "schedule",
    "service",
    "servicecategory",
    "shelterphoto",
    "shelterprogram",
    "sheltertype",
    "spa",
    "specialsituationrestriction",
    "storage",
    "vaccinationrequirement",
    "video",
    "exteriorshelterphoto",
    "interiorshelterphoto",
    "address",  # from common app
    "shelteravailability",
)


def seed_spas() -> None:
    for name, short_name, long_name in SPA_DATA:
        _, created = SPA.objects.get_or_create(
            name=name,
            defaults={"short_name": short_name, "long_name": long_name},
        )
        if created:
            logger.info("Created SPA: %s", long_name)


def _get_shared_permissions() -> list[Permission]:
    """Return all CRUD permissions for shared shelter models."""
    perms = []
    for model_name in _SHARED_PERMISSION_MODELS:
        app_label = "common" if model_name == "address" else "shelters"
        perms.extend(
            Permission.objects.filter(
                content_type__app_label=app_label,
                content_type__model=model_name,
            )
        )
    return perms


def _get_shelter_crud_permissions() -> list[Permission]:
    """Return ADD/CHANGE/DELETE/VIEW permissions for Shelter."""
    ct = ContentType.objects.get(app_label="shelters", model="shelter")
    return list(Permission.objects.filter(content_type=ct, codename__in=[
        "add_shelter", "change_shelter", "delete_shelter", "view_shelter",
    ]))


def seed_shelter_groups() -> None:
    """Create legacy auth groups matching the original migration.

    Shelter Data Entry: CRUD on shared models + Shelter CRUD only (no custom perms).
    Shelter Administration: CRUD on shared models + ALL Shelter perms (including custom).
    """
    shared_perms = _get_shared_permissions()
    shelter_crud = _get_shelter_crud_permissions()
    all_shelter_perms = list(Permission.objects.filter(content_type__app_label="shelters", content_type__model="shelter"))

    # Shelter Data Entry
    data_entry, _ = Group.objects.get_or_create(name="Shelter Data Entry")
    data_entry.perms = set(shared_perms) | set(shelter_crud)
    data_entry.permissions.set(data_entry.perms)

    # Shelter Administration (CRUD + custom perms on Shelter)
    admin, _ = Group.objects.get_or_create(name="Shelter Administration")
    admin.perms = set(shared_perms) | set(all_shelter_perms)
    admin.permissions.set(admin.perms)


def seed_shelter_lookups() -> None:
    seed_spas()
    seed_shelter_groups()

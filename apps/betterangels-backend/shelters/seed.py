"""Seed data for shelter lookups (SPAs), service catalog, and legacy auth groups.

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

SERVICE_CATALOG = [
    (
        "immediate_need",
        "Immediate Needs",
        0,
        [
            ("clothing", "Clothing", 0),
            ("food", "Food", 1),
            ("showers", "Showers", 2),
        ],
    ),
    (
        "general",
        "General Services",
        1,
        [
            ("case_management", "Case Management", 0),
            ("childcare", "Childcare", 1),
            ("computer_access", "Computer Access", 2),
            ("employment_services", "Employment Services", 3),
            ("financial_literacy_assistance", "Financial Literacy/Assistance", 4),
            ("housing_navigation", "Housing Navigation", 5),
            ("legal_assistance", "Legal Assistance", 6),
            ("mail", "Mail", 7),
            ("phone", "Phone", 8),
            ("transportation", "Transportation", 9),
            ("laundry", "Laundry Services", 10),
            ("tls", "TLS (Time Limited Subsidies)", 11),
        ],
    ),
    (
        "health",
        "Health Services",
        2,
        [
            ("dental", "Dental", 0),
            ("medical", "Medical", 1),
            ("mental_health", "Mental Health", 2),
            ("substance_use_treatment", "Substance Use Treatment", 3),
        ],
    ),
    (
        "training",
        "Training Services",
        3,
        [
            ("job_training", "Job Training", 0),
            ("life_skills_training", "Life Skills Training", 1),
            ("tutoring", "Tutoring", 2),
        ],
    ),
    (
        "meal",
        "Meal Services",
        4,
        [
            ("breakfast", "Breakfast", 0),
            ("lunch", "Lunch", 1),
            ("dinner", "Dinner", 2),
        ],
    ),
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
    perms: list[Permission] = []
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
    return list(
        Permission.objects.filter(
            content_type=ct,
            codename__in=[
                "add_shelter",
                "change_shelter",
                "delete_shelter",
                "view_shelter",
            ],
        )
    )


def seed_services() -> None:
    """Seed ServiceCategory and Service catalog (matching original migration)."""
    from shelters.models.service import Service, ServiceCategory

    for cat_name, cat_display, cat_order, services in SERVICE_CATALOG:
        category, created = ServiceCategory.objects.get_or_create(
            name=cat_name,
            defaults={"display_name": cat_display, "priority": cat_order},
        )
        if created:
            logger.info("Created ServiceCategory: %s", cat_display)
        for svc_name, svc_display, svc_order in services:
            _, created = Service.objects.get_or_create(
                category=category,
                name=svc_name,
                defaults={
                    "display_name": svc_display,
                    "priority": svc_order,
                    "is_other": False,
                },
            )
            if created:
                logger.info("Created Service: %s", svc_display)


def seed_shelter_groups() -> None:
    """Create legacy auth groups matching the original migration.

    Shelter Data Entry: CRUD on shared models + Shelter CRUD only (no custom perms).
    Shelter Administration: CRUD on shared models + ALL Shelter perms (including custom).
    """
    shared_perms = _get_shared_permissions()
    shelter_crud = _get_shelter_crud_permissions()
    all_shelter_perms = list(
        Permission.objects.filter(content_type__app_label="shelters", content_type__model="shelter")
    )

    # Shelter Data Entry
    data_entry, _ = Group.objects.get_or_create(name="Shelter Data Entry")
    data_entry_perms = set(shared_perms) | set(shelter_crud)
    data_entry.permissions.set(data_entry_perms)

    # Shelter Administration (CRUD + custom perms on Shelter)
    admin, _ = Group.objects.get_or_create(name="Shelter Administration")
    admin_perms = set(shared_perms) | set(all_shelter_perms)
    admin.permissions.set(admin_perms)


def seed_shelter_lookups() -> None:
    seed_spas()
    seed_services()
    seed_shelter_groups()

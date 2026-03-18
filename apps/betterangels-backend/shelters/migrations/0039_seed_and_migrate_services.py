from django.db import migrations

# (category_name, category_display_name, priority, services)
# services: list of (name, display_name, priority)
SEED_DATA = [
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

# Maps old M2M field name -> ServiceCategory.name used in the seed.
OLD_FIELD_TO_CATEGORY = {
    "immediate_needs": "immediate_need",
    "general_services": "general",
    "health_services": "health",
    "training_services": "training",
    "meal_services": "meal",
}


def seed_catalog(apps, schema_editor):
    ServiceCategory = apps.get_model("shelters", "ServiceCategory")
    Service = apps.get_model("shelters", "Service")
    for cat_name, cat_display, cat_order, services in SEED_DATA:
        category, _ = ServiceCategory.objects.get_or_create(
            name=cat_name,
            defaults={"display_name": cat_display, "priority": cat_order},
        )
        for svc_name, svc_display, svc_order in services:
            Service.objects.get_or_create(
                category=category,
                name=svc_name,
                defaults={
                    "display_name": svc_display,
                    "priority": svc_order,
                    "is_other": False,
                },
            )


def unseed_catalog(apps, schema_editor):
    ServiceCategory = apps.get_model("shelters", "ServiceCategory")
    ServiceCategory.objects.filter(name__in=[c[0] for c in SEED_DATA]).delete()


def migrate_old_services(apps, schema_editor):
    """Copy old enum-backed M2M relationships into the unified services field."""
    Shelter = apps.get_model("shelters", "Shelter")
    Service = apps.get_model("shelters", "Service")

    service_lookup = {}
    for svc in Service.objects.select_related("category").all():
        service_lookup[(svc.category.name, svc.name)] = svc.pk

    for shelter in Shelter.objects.prefetch_related(
        "immediate_needs",
        "general_services",
        "health_services",
        "training_services",
        "meal_services",
    ).iterator(chunk_size=500):
        new_service_pks = set()
        for old_field, cat_name in OLD_FIELD_TO_CATEGORY.items():
            for old_obj in getattr(shelter, old_field).all():
                key = (cat_name, str(old_obj.name))
                if key in service_lookup:
                    new_service_pks.add(service_lookup[key])
        if new_service_pks:
            shelter.services.add(*new_service_pks)


class Migration(migrations.Migration):

    dependencies = [
        ("shelters", "0038_add_service_catalog"),
    ]

    operations = [
        migrations.RunPython(seed_catalog, unseed_catalog),
        migrations.RunPython(migrate_old_services, migrations.RunPython.noop),
    ]
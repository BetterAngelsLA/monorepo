"""Data migration: copy old service M2M relationships into the unified ``services`` field.

For every shelter, reads its old enum-backed M2M fields (``immediate_needs``,
``general_services``, ``health_services``, ``training_services``,
``meal_services``) and maps each entry to the corresponding row in the new
``Service`` table (matched by ``Service.name`` within the correct
``ServiceCategory``).  The matched ``Service`` PKs are added to the shelter's
``services`` M2M.

This is safe to run multiple times — it only *adds* to ``services``.
"""

from django.db import migrations

# Maps old M2M field name → ServiceCategory.name used in the seed (0038).
OLD_FIELD_TO_CATEGORY = {
    "immediate_needs": "immediate_need",
    "general_services": "general",
    "health_services": "health",
    "training_services": "training",
    "meal_services": "meal",
}


def forwards(apps, schema_editor):
    Shelter = apps.get_model("shelters", "Shelter")
    Service = apps.get_model("shelters", "Service")
    ServiceCategory = apps.get_model("shelters", "ServiceCategory")

    # Build a lookup: (category_name, service_name) → Service PK
    category_name_to_id = {c.name: c.id for c in ServiceCategory.objects.all()}
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
            old_manager = getattr(shelter, old_field)
            for old_obj in old_manager.all():
                # old_obj.name is the enum value string (e.g. "clothing")
                key = (cat_name, str(old_obj.name))
                if key in service_lookup:
                    new_service_pks.add(service_lookup[key])

        if new_service_pks:
            # Add without clearing — preserves any services already set.
            shelter.services.add(*new_service_pks)


def backwards(apps, schema_editor):
    # Clearing the services M2M would lose data; leave as no-op.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("shelters", "0038_seed_service_catalog"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]

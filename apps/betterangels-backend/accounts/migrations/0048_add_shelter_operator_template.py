"""Create 'Shelter Operator' PermissionGroupTemplate with core shelter permissions.

This template grants CRUD on the primary shelter models (Shelter, Bed, Room, Reservation).
It does NOT include org-level permissions (add/remove members, portal access) — those
come from composing with Organization Admin or Organization Superuser templates.
"""

from django.db import migrations

# Core models that shelter operators interact with directly
SHELTER_OPERATOR_MODELS = [
    "shelter",
    "bed",
    "room",
    "reservation",
    "reservationclient",
]


def create_shelter_operator_template(apps, schema_editor):
    PermissionGroupTemplate = apps.get_model("accounts", "PermissionGroupTemplate")
    Permission = apps.get_model("auth", "Permission")

    template, _ = PermissionGroupTemplate.objects.get_or_create(name="Shelter Operator")

    # Assign CRUD permissions for core shelter models only
    shelter_permissions = Permission.objects.filter(
        content_type__app_label="shelters",
        content_type__model__in=SHELTER_OPERATOR_MODELS,
    )
    template.permissions.add(*shelter_permissions)


def reverse(apps, schema_editor):
    PermissionGroupTemplate = apps.get_model("accounts", "PermissionGroupTemplate")
    PermissionGroupTemplate.objects.filter(name="Shelter Operator").delete()


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0047_seed_org_types_and_backfill"),
        ("shelters", "0001_squashed_initial"),
    ]

    operations = [
        migrations.RunPython(create_shelter_operator_template, reverse),
    ]

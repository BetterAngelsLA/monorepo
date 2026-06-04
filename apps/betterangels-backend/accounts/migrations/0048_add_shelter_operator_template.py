"""Create 'Shelter Operator' PermissionGroupTemplate with shelter CRUD permissions.

This template grants CRUD on the Shelter model via ShelterPermissions enum
defined in shelters/groups.py.  It does NOT include org-level permissions
(add/remove members, portal access) — those come from composing with
Organization Admin or Organization Superuser templates.
"""

from django.db import migrations


def create_shelter_operator_template(apps, schema_editor):
    PermissionGroupTemplate = apps.get_model("accounts", "PermissionGroupTemplate")
    Permission = apps.get_model("auth", "Permission")

    from shelters.groups import SHELTER_OPERATOR, SHELTER_OPERATOR_PERMISSIONS

    template, _ = PermissionGroupTemplate.objects.get_or_create(name=SHELTER_OPERATOR)

    for perm in SHELTER_OPERATOR_PERMISSIONS:
        app_label, codename = perm.split(".")
        db_perm = Permission.objects.get(codename=codename, content_type__app_label=app_label)
        template.permissions.add(db_perm)


def reverse(apps, schema_editor):
    PermissionGroupTemplate = apps.get_model("accounts", "PermissionGroupTemplate")

    from shelters.groups import SHELTER_OPERATOR

    PermissionGroupTemplate.objects.filter(name=SHELTER_OPERATOR).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0046_add_organization_profile"),
        ("shelters", "0001_squashed_initial"),
    ]

    operations = [
        migrations.RunPython(create_shelter_operator_template, reverse),
    ]

"""Create 'Shelter Operator' PermissionGroupTemplate with shelter CRUD permissions.

This template grants CRUD on the Shelter, Bed, Room, and Reservation models
via the permissions defined in shelters/groups.py.  It does NOT include
org-level permissions (add/remove members, portal access) — those come from
composing with Organization Admin or Organization Superuser templates.
"""

from common.migrations.utils import ensure_permissions
from django.db import migrations


def create_shelter_operator_template(apps, schema_editor):
    PermissionGroupTemplate = apps.get_model("accounts", "PermissionGroupTemplate")

    from shelters.groups import SHELTER_OPERATOR

    template, _ = PermissionGroupTemplate.objects.get_or_create(name=SHELTER_OPERATOR.name)

    permissions = ensure_permissions(apps, schema_editor, list(SHELTER_OPERATOR.permissions))
    template.permissions.add(*permissions)


def reverse(apps, schema_editor):
    PermissionGroupTemplate = apps.get_model("accounts", "PermissionGroupTemplate")

    from shelters.groups import SHELTER_OPERATOR

    PermissionGroupTemplate.objects.filter(name=SHELTER_OPERATOR.name).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0046_add_organization_profile"),
        ("shelters", "0001_squashed_initial"),
    ]

    operations = [
        migrations.RunPython(create_shelter_operator_template, reverse),
    ]

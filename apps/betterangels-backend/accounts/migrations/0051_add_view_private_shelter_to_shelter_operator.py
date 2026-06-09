"""Add view_private_shelter to Shelter Operator template.

Shelter Operators need to view private shelters managed by their
organization.  This was previously on the Caseworker template but
belongs here instead.
"""

from common.migrations._utils import ensure_permissions
from django.db import migrations


def add_view_private_shelter(apps, schema_editor):
    PermissionGroupTemplate = apps.get_model("accounts", "PermissionGroupTemplate")

    from shelters.groups import SHELTER_OPERATOR

    permissions = ensure_permissions(apps, schema_editor, list(SHELTER_OPERATOR.permissions))

    try:
        template = PermissionGroupTemplate.objects.get(name=SHELTER_OPERATOR.name)
        template.permissions.add(*permissions)
    except PermissionGroupTemplate.DoesNotExist:
        pass


def reverse(apps, schema_editor):
    # No reverse — this is a correction.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0050_remove_view_private_shelter_from_caseworker"),
        ("shelters", "0001_squashed_initial"),
    ]

    operations = [
        migrations.RunPython(add_view_private_shelter, reverse),
    ]

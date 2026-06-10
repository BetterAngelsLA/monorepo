"""Clean up Caseworker template and rebuild Shelter Operator permissions.

1. Removes legacy ``accounts.add_client`` from Caseworker.
2. Removes ``view_private_shelter`` from Caseworker (belongs on Shelter Operator).
3. Rebuilds Shelter Operator permissions from ``shelters/groups.py`` so any
   later additions to the config are reflected in the database.
"""

from common.migrations._utils import ensure_permissions
from django.db import migrations


def cleanup_caseworker_and_rebuild_shelter_operator(apps, schema_editor):
    PermissionGroupTemplate = apps.get_model("accounts", "PermissionGroupTemplate")
    Permission = apps.get_model("auth", "Permission")

    # ── Caseworker: remove legacy add_client ──────────────────────────────
    try:
        template = PermissionGroupTemplate.objects.get(name="Caseworker")
        template.permissions.remove(Permission.objects.get(codename="add_client", content_type__app_label="accounts"))
        template.permissions.remove(
            Permission.objects.get(codename="view_private_shelter", content_type__app_label="shelters")
        )
    except (PermissionGroupTemplate.DoesNotExist, Permission.DoesNotExist):
        pass

    # ── Shelter Operator: rebuild from current shelters/groups.py ────────
    from shelters.groups import SHELTER_OPERATOR

    try:
        template = PermissionGroupTemplate.objects.get(name=SHELTER_OPERATOR.name)
        permissions = ensure_permissions(apps, schema_editor, list(SHELTER_OPERATOR.permissions))
        template.permissions.set(permissions)
    except PermissionGroupTemplate.DoesNotExist:
        pass


def reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0048_add_shelter_operator_template"),
        ("shelters", "0001_squashed_initial"),
    ]

    operations = [
        migrations.RunPython(cleanup_caseworker_and_rebuild_shelter_operator, reverse),
    ]

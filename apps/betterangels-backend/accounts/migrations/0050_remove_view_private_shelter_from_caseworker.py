"""Remove view_private_shelter from Caseworker PermissionGroupTemplate.

Caseworkers shouldn't have blanket access to private shelters.
This permission should be granted to Shelter Operators and shelter
admins instead, on a per-shelter basis.
"""

from django.db import migrations


def remove_view_private_shelter(apps, schema_editor):
    PermissionGroupTemplate = apps.get_model("accounts", "PermissionGroupTemplate")
    Permission = apps.get_model("auth", "Permission")

    try:
        template = PermissionGroupTemplate.objects.get(name="Caseworker")
        perm = Permission.objects.get(codename="view_private_shelter", content_type__app_label="shelters")
        template.permissions.remove(perm)
    except (PermissionGroupTemplate.DoesNotExist, Permission.DoesNotExist):
        pass


def reverse(apps, schema_editor):
    # Restored in the squashed initial migration if needed.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0049_remove_legacy_add_client_from_caseworker"),
        ("shelters", "0001_squashed_initial"),
    ]

    operations = [
        migrations.RunPython(remove_view_private_shelter, reverse),
    ]

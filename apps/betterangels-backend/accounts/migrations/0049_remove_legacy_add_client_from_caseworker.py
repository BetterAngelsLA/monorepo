"""Remove legacy accounts.add_client from Caseworker PermissionGroupTemplate.

The accounts.add_client permission was for the deprecated Client model
(not ClientProfile).  It has been superseded and should no longer be
part of the Caseworker template.
"""

from django.db import migrations


def remove_legacy_add_client(apps, schema_editor):
    PermissionGroupTemplate = apps.get_model("accounts", "PermissionGroupTemplate")
    Permission = apps.get_model("auth", "Permission")

    try:
        template = PermissionGroupTemplate.objects.get(name="Caseworker")
        perm = Permission.objects.get(codename="add_client", content_type__app_label="accounts")
        template.permissions.remove(perm)
    except (PermissionGroupTemplate.DoesNotExist, Permission.DoesNotExist):
        pass


def reverse(apps, schema_editor):
    # No reverse — restoring a deprecated permission is not desired.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0048_add_shelter_operator_template"),
        ("auth", "0012_alter_user_first_name_max_length"),
    ]

    operations = [
        migrations.RunPython(remove_legacy_add_client, reverse),
    ]

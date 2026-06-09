"""Reconcile Caseworker template permissions to ADD + VIEW only.

Removes CHANGE and DELETE from the Caseworker template for all models
(granted per-object at creation) and adds missing VIEW for ServiceRequest.
Ensures all models that contribute to the Caseworker template are present.
"""

from common.migrations._utils import ensure_permissions
from django.db import migrations


def reconcile_caseworker_template(apps, schema_editor):
    PermissionGroupTemplate = apps.get_model("accounts", "PermissionGroupTemplate")

    from notes.groups import CASEWORKER

    template = PermissionGroupTemplate.objects.get(name=CASEWORKER.name)

    permissions = ensure_permissions(apps, schema_editor, list(CASEWORKER.permissions))

    # Replace all permissions with the canonical set from notes/groups.py
    template.permissions.set(permissions)


def reverse(apps, schema_editor):
    # No reverse — the old permissions included CHANGE and DELETE which
    # should not be restored.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0048_add_shelter_operator_template"),
        ("notes", "0001_squash_through_0020"),
        ("clients", "0027_socialmediaprofile_permissions"),
        ("tasks", "0004_remove_task_task_add_insert_and_more"),
        ("shelters", "0001_squashed_initial"),
        ("common", "0016_auto_20241121_1844"),
    ]

    operations = [
        migrations.RunPython(reconcile_caseworker_template, reverse),
    ]

from django.db import migrations, models
import django.db.models.deletion


def update_caseworker_permission_template(apps, schema_editor):
    PermissionGroupTemplate = apps.get_model("accounts", "PermissionGroupTemplate")
    Permission = apps.get_model("auth", "Permission")
    caseworker_template = PermissionGroupTemplate.objects.get(name="Caseworker")

    perm_map = [
        perm.split(".")[1]
        for perm in [
            "notes.view_task",
            "notes.change_task",
            "notes.delete_task",
            "notes.add_task",
        ]
    ]

    permissions = Permission.objects.filter(codename__in=perm_map)
    caseworker_template.permissions.add(*permissions)


def revert_caseworker_permission_template(apps, schema_editor):
    PermissionGroupTemplate = apps.get_model("accounts", "PermissionGroupTemplate")
    Permission = apps.get_model("auth", "Permission")
    caseworker_template = PermissionGroupTemplate.objects.get(name="Caseworker")

    perm_map = [
        perm.split(".")[1]
        for perm in [
            "notes.view_task",
            "notes.change_task",
            "notes.delete_task",
            "notes.add_task",
        ]
    ]

    permissions = Permission.objects.filter(codename__in=perm_map)
    caseworker_template.permissions.remove(*permissions)


class Migration(migrations.Migration):
    dependencies = [
        ("notes", "0010_add_casemanager_task_permissions"),
    ]

    operations = [
        migrations.RunPython(
            update_caseworker_permission_template, revert_caseworker_permission_template
        ),
    ]

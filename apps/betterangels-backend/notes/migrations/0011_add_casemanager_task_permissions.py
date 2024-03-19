from django.db import migrations
from django.contrib.auth.models import Permission
from django.contrib.auth.management import create_permissions
from django.contrib.auth.models import Permission
from django.db import migrations
from notes.permissions import TaskPermissions

PERMISSIONS_TO_ADD = [
    TaskPermissions.ADD,
    TaskPermissions.CHANGE,
    TaskPermissions.DELETE,
    TaskPermissions.VIEW,
]

# Generate readable names based on the enum
PERM_MAP = {
    perm.split(".")[1]: "Can " + perm.name.lower().replace("_", " ") + " task"
    for perm in TaskPermissions
}


def create_permissions_if_not_exist(apps, schema_editor):
    Task = apps.get_model("notes", "Task")
    Permission = apps.get_model("auth", "Permission")
    ContentType = apps.get_model("contenttypes", "ContentType")
    TaskContentType = ContentType.objects.get_for_model(Task)
    db_alias = schema_editor.connection.alias

    for codename, name in PERM_MAP.items():
        Permission.objects.using(db_alias).get_or_create(
            codename=codename,
            defaults={"name": name, "content_type": TaskContentType},
        )


def update_caseworker_permission_template(apps, schema_editor):
    PermissionGroupTemplate = apps.get_model("accounts", "PermissionGroupTemplate")
    Permission = apps.get_model("auth", "Permission")
    caseworker_template = PermissionGroupTemplate.objects.get(name="Caseworker")

    perm_map = [
        perm.split(".")[1]
        for perm in [
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
            "notes.add_task",
        ]
    ]

    permissions = Permission.objects.filter(codename__in=perm_map)
    caseworker_template.permissions.remove(*permissions)


class Migration(migrations.Migration):
    dependencies = [
        ("contenttypes", "0002_remove_content_type_name"),
        ("accounts", "0007_add_caseworker_role"),
        ("notes", "0010_add_task_and_taskpermission"),
    ]

    operations = [
        migrations.RunPython(create_permissions_if_not_exist),
        migrations.RunPython(
            update_caseworker_permission_template, revert_caseworker_permission_template
        ),
    ]

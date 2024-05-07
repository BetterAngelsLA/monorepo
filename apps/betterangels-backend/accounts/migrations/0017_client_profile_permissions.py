# Generated by Django 4.2.11 on 2024-04-17 06:36

from accounts.permissions import ClientProfilePermissions
from django.db import migrations

PERMISSIONS_TO_ADD = [
    ClientProfilePermissions.ADD,
    ClientProfilePermissions.CHANGE,
    ClientProfilePermissions.DELETE,
    ClientProfilePermissions.VIEW,
]

# Generate readable names based on the enum
PERM_MAP = {
    perm.split(".")[1]: "Can " + perm.name.lower().replace("_", " ") + " clientprofile"
    for perm in ClientProfilePermissions
}


def create_permissions_if_not_exist(apps, schema_editor):
    Client = apps.get_model("accounts", "Client")
    Permission = apps.get_model("auth", "Permission")
    ContentType = apps.get_model("contenttypes", "ContentType")
    ClientContentType = ContentType.objects.get_for_model(Client)
    db_alias = schema_editor.connection.alias

    for codename, name in PERM_MAP.items():
        Permission.objects.using(db_alias).get_or_create(
            codename=codename,
            defaults={"name": name, "content_type": ClientContentType},
        )


def update_caseworker_permission_template(apps, schema_editor):
    PermissionGroupTemplate = apps.get_model("accounts", "PermissionGroupTemplate")
    Permission = apps.get_model("auth", "Permission")
    caseworker_template = PermissionGroupTemplate.objects.get(name="Caseworker")

    perm_map = [
        perm.split(".")[1]
        for perm in [
            "accounts.add_clientprofile",
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
            "accounts.add_clientprofile",
        ]
    ]

    permissions = Permission.objects.filter(codename__in=perm_map)
    caseworker_template.permissions.remove(*permissions)


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0016_alter_clientprofile_hmis_id"),
    ]

    operations = [
        migrations.RunPython(create_permissions_if_not_exist),
        migrations.RunPython(update_caseworker_permission_template, revert_caseworker_permission_template),
    ]

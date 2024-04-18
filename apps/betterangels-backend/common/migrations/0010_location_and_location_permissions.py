from common.permissions.enums import LocationPermissions
from django.db import migrations

PERMISSIONS_TO_ADD = [
    LocationPermissions.ADD,
    LocationPermissions.CHANGE,
    LocationPermissions.DELETE,
    LocationPermissions.VIEW,
]

# Generate readable names based on the enum
PERM_MAP = {
    perm.split(".")[1]: "Can " + perm.name.lower().replace("_", " ") + " location" for perm in LocationPermissions
}


def create_permissions_if_not_exist(apps, schema_editor):
    Location = apps.get_model("common", "Location")
    Permission = apps.get_model("auth", "Permission")
    ContentType = apps.get_model("contenttypes", "ContentType")
    LocationContentType = ContentType.objects.get_for_model(Location)
    db_alias = schema_editor.connection.alias

    for codename, name in PERM_MAP.items():
        Permission.objects.using(db_alias).get_or_create(
            codename=codename,
            defaults={"name": name, "content_type": LocationContentType},
        )


def update_caseworker_permission_template(apps, schema_editor):
    PermissionGroupTemplate = apps.get_model("accounts", "PermissionGroupTemplate")
    Permission = apps.get_model("auth", "Permission")
    caseworker_template = PermissionGroupTemplate.objects.get(name="Caseworker")

    perm_map = [
        perm.split(".")[1]
        for perm in [
            "common.add_location",
            "common.view_location",
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
            "common.add_location",
            "common.view_location",
        ]
    ]

    permissions = Permission.objects.filter(codename__in=perm_map)
    caseworker_template.permissions.remove(*permissions)


class Migration(migrations.Migration):
    dependencies = [
        ("contenttypes", "0002_remove_content_type_name"),
        ("accounts", "0007_add_caseworker_role"),
        ("common", "0009_locationuserobjectpermission_and_more"),
    ]

    operations = [
        migrations.RunPython(create_permissions_if_not_exist),
        migrations.RunPython(update_caseworker_permission_template, revert_caseworker_permission_template),
    ]

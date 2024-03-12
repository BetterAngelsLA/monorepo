from django.db import migrations
from notes.permissions import ServiceRequestPermissions

PERMISSIONS_TO_ADD = [
    ServiceRequestPermissions.ADD,
    ServiceRequestPermissions.CHANGE,
    ServiceRequestPermissions.DELETE,
    ServiceRequestPermissions.VIEW,
]

# Generate readable names based on the enum
PERM_MAP = {
    perm.split(".")[1]: "Can "
    + perm.name.lower().replace("_", " ")
    + " service request"
    for perm in ServiceRequestPermissions
}


def create_permissions_if_not_exist(apps, schema_editor):
    ServiceRequest = apps.get_model("notes", "ServiceRequest")
    Permission = apps.get_model("auth", "Permission")
    ContentType = apps.get_model("contenttypes", "ContentType")
    ServiceRequestContentType = ContentType.objects.get_for_model(ServiceRequest)
    db_alias = schema_editor.connection.alias

    for codename, name in PERM_MAP.items():
        Permission.objects.using(db_alias).get_or_create(
            codename=codename,
            defaults={"name": name, "content_type": ServiceRequestContentType},
        )


def update_caseworker_permission_template(apps, schema_editor):
    PermissionGroupTemplate = apps.get_model("accounts", "PermissionGroupTemplate")
    Permission = apps.get_model("auth", "Permission")
    caseworker_template = PermissionGroupTemplate.objects.get(name="Caseworker")

    perm_map = [
        perm.split(".")[1]
        for perm in [
            "notes.add_service_request",
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
            "notes.add_service_request",
        ]
    ]

    permissions = Permission.objects.filter(codename__in=perm_map)
    caseworker_template.permissions.remove(*permissions)


class Migration(migrations.Migration):
    dependencies = [
        ("notes", "0012_add_servicerequest_and_servicerequestpermission"),
    ]

    operations = [
        migrations.RunPython(create_permissions_if_not_exist),
        migrations.RunPython(
            update_caseworker_permission_template, revert_caseworker_permission_template
        ),
    ]

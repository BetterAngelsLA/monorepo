# Generated by Django 5.1.7 on 2025-03-25 18:03

from clients.permissions import HmisProfilePermissions
from django.db import migrations


def create_permissions_if_not_exist(apps, schema_editor):
    HmisProfile = apps.get_model("clients", "HmisProfile")
    Permission = apps.get_model("auth", "Permission")
    ContentType = apps.get_model("contenttypes", "ContentType")
    HmisProfileContentType = ContentType.objects.get_for_model(HmisProfile)
    db_alias = schema_editor.connection.alias

    # Generate readable names based on the enum
    PERM_MAP = {perm.split(".")[1]: perm.label for perm in HmisProfilePermissions}
    for codename, name in PERM_MAP.items():
        Permission.objects.using(db_alias).get_or_create(
            codename=codename,
            content_type=HmisProfileContentType,
            defaults={"name": name, "content_type": HmisProfileContentType},
        )


def update_caseworker_permission_template(apps, schema_editor):
    PermissionGroupTemplate = apps.get_model("accounts", "PermissionGroupTemplate")
    Permission = apps.get_model("auth", "Permission")
    ContentType = apps.get_model("contenttypes", "ContentType")
    HmisProfile = apps.get_model("clients", "HmisProfile")
    HmisProfileContentType = ContentType.objects.get_for_model(HmisProfile)
    caseworker_template = PermissionGroupTemplate.objects.get(name="Caseworker")

    perm_map = [
        perm.split(".")[1]
        for perm in [
            "clients.add_hmisprofile",
            "clients.view_hmisprofile",
            "clients.change_hmisprofile",
            "clients.delete_hmisprofile",
        ]
    ]

    permissions = Permission.objects.filter(codename__in=perm_map, content_type=HmisProfileContentType)
    caseworker_template.permissions.add(*permissions)


class Migration(migrations.Migration):

    dependencies = [
        ("clients", "0018_clientdocument_proxy"),
    ]

    operations = [
        migrations.RunPython(create_permissions_if_not_exist),
        migrations.RunPython(update_caseworker_permission_template),
    ]

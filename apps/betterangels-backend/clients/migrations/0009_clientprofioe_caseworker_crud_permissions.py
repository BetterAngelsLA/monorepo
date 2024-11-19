# Generated by Django 5.1.3 on 2024-11-19 23:43

from django.db import migrations


def update_caseworker_permission_template(apps, schema_editor):
    PermissionGroupTemplate = apps.get_model("accounts", "PermissionGroupTemplate")
    Permission = apps.get_model("auth", "Permission")
    ContentType = apps.get_model("contenttypes", "ContentType")
    ClientProfile = apps.get_model("clients", "ClientProfile")
    ClientProfileContentType = ContentType.objects.get_for_model(ClientProfile)
    caseworker_template = PermissionGroupTemplate.objects.get(name="Caseworker")

    perm_map = [
        perm.split(".")[1]
        for perm in [
            "accounts.change_clientprofile",
            "accounts.delete_clientprofile",
            "accounts.view_clientprofile",
        ]
    ]

    permissions = Permission.objects.filter(codename__in=perm_map, content_type=ClientProfileContentType)
    caseworker_template.permissions.add(*permissions)


class Migration(migrations.Migration):

    dependencies = [
        ("clients", "0008_clientprofile_california_id"),
    ]

    operations = [
        migrations.RunPython(update_caseworker_permission_template),
    ]

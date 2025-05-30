# Generated by Django 5.1.3 on 2024-11-21 18:44

from django.db import migrations


def update_caseworker_permission_template(apps, schema_editor):
    PermissionGroupTemplate = apps.get_model("accounts", "PermissionGroupTemplate")
    Permission = apps.get_model("auth", "Permission")
    ContentType = apps.get_model("contenttypes", "ContentType")
    Attachment = apps.get_model("common", "Attachment")
    AttachmentContentType = ContentType.objects.get_for_model(Attachment)
    caseworker_template = PermissionGroupTemplate.objects.get(name="Caseworker")

    perm_map = [
        perm.split(".")[1]
        for perm in [
            "common.view_attachment",
        ]
    ]

    # NOTE: This grants caseworkers global permissions to view all items using the Attachment model.
    # Fine for now because we are only allowing uploads of items that caseworkers should have access to.
    # Will need to update these perm grants if that changes.
    permissions = Permission.objects.filter(codename__in=perm_map, content_type=AttachmentContentType)
    caseworker_template.permissions.add(*permissions)


class Migration(migrations.Migration):

    dependencies = [
        ("common", "0015_phonenumber"),
    ]

    operations = [
        migrations.RunPython(update_caseworker_permission_template),
    ]

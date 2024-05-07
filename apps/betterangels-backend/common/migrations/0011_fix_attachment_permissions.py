from accounts.permissions import ClientPermissions
from common.permissions.enums import AttachmentPermissions
from django.db import migrations


def rename_attachment_permissions(apps, schema_editor):
    db_alias = schema_editor.connection.alias
    Permission = apps.get_model("auth", "Permission")
    Attachment = apps.get_model("common", "Attachment")
    ContentType = apps.get_model("contenttypes", "ContentType")
    AttachmentContentType = ContentType.objects.get_for_model(Attachment)

    PERM_MAP = {perm.split(".")[1]: perm.label for perm in AttachmentPermissions}

    for codename, name in PERM_MAP.items():
        cur_perm = Permission.objects.using(db_alias).get(
            codename=codename,
            content_type=AttachmentContentType,
        )
        cur_perm.name = name
        cur_perm.save()


def rename_client_permissions(apps, schema_editor):
    db_alias = schema_editor.connection.alias
    Permission = apps.get_model("auth", "Permission")
    Client = apps.get_model("accounts", "Client")
    ContentType = apps.get_model("contenttypes", "ContentType")
    ClientContentType = ContentType.objects.get_for_model(Client)

    PERM_MAP = {perm.split(".")[1]: perm.label for perm in ClientPermissions}

    for codename, name in PERM_MAP.items():
        cur_perm = Permission.objects.using(db_alias).get(
            codename=codename,
            content_type=ClientContentType,
        )
        cur_perm.name = name
        cur_perm.save()


class Migration(migrations.Migration):
    dependencies = [
        ("common", "0010_location_and_location_permissions"),
    ]

    operations = [migrations.RunPython(rename_attachment_permissions), migrations.RunPython(rename_client_permissions)]

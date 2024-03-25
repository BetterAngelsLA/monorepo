from common.permissions.enums import AttachmentPermissions
from django.db import migrations


def update_caseworker_permission_template(apps, schema_editor):
    PermissionGroupTemplate = apps.get_model("accounts", "PermissionGroupTemplate")
    Permission = apps.get_model("auth", "Permission")
    ContentType = apps.get_model("contenttypes", "ContentType")
    caseworker_template = PermissionGroupTemplate.objects.get(name="Caseworker")

    # Remove mistaken permission
    PostOfficeAttachment = apps.get_model("post_office", "Attachment")
    PostOfficeAttachmentContentType = ContentType.objects.get_for_model(
        PostOfficeAttachment
    )
    perms_to_remove = caseworker_template.permissions.filter(
        content_type=PostOfficeAttachmentContentType
    )
    caseworker_template.permissions.remove(*perms_to_remove)

    # Add actual Permission
    CommonAttachment = apps.get_model("common", "Attachment")
    AttachmentContentType = ContentType.objects.get_for_model(CommonAttachment)

    perm_map = [
        perm.split(".")[1]
        for perm in [
            AttachmentPermissions.ADD,
        ]
    ]

    permissions = Permission.objects.filter(
        content_type=AttachmentContentType, codename__in=perm_map
    )
    caseworker_template.permissions.add(*permissions)


class Migration(migrations.Migration):
    dependencies = [
        ("post_office", "0011_models_help_text"),
        ("common", "0004_attachment_attachmentgroupobjectpermission_and_more"),
    ]

    operations = [
        migrations.RunPython(update_caseworker_permission_template),
    ]

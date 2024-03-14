from django.db import migrations


def delete_permissions(apps, schema_editor):
    """
    Deletes permissions for the SimpleModel.
    """
    Permission = apps.get_model("auth", "Permission")
    ContentType = apps.get_model("contenttypes", "ContentType")
    SimpleModel = apps.get_model("common", "SimpleModel")

    SimpleModelContentType = ContentType.objects.get_for_model(SimpleModel)

    permissions_to_delete = [
        "view_simplemodel",
        "change_simplemodel",
        "delete_simplemodel",
        "add_simplemodel",
    ]

    for codename in permissions_to_delete:
        Permission.objects.filter(
            codename=codename,
            content_type=SimpleModelContentType,
        ).delete()


class Migration(migrations.Migration):

    dependencies = [
        # Ensure this dependency points to the migration that added the permissions
        # Replace '0001_initial' with the correct file name or migration identifier.
        ("common", "0003_alter_location_point"),
    ]

    operations = [
        migrations.RunPython(delete_permissions),
    ]

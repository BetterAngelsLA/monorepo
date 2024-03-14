import django
from django.conf import settings
from django.db import migrations, models


class SimpleModelPermissions(models.TextChoices):
    VIEW = "simplemodels.view_simplemodel", "Can view simplemodel"
    CHANGE = "simplemodels.change_simplemodel", "Can change simplemodel"
    DELETE = "simplemodels.delete_simplemodel", "Can delete simplemodel"
    ADD = "simplemodels.add_simplemodel", "Can add simplemodel"


def create_permissions_if_not_exist(apps, schema_editor):
    SimpleModel = apps.get_model("common", "SimpleModel")
    ContentType = apps.get_model("contenttypes", "ContentType")
    Permission = apps.get_model("auth", "Permission")

    SimpleModelContentType = ContentType.objects.get_for_model(SimpleModel)

    permissions_to_add = [
        SimpleModelPermissions.VIEW,
        SimpleModelPermissions.CHANGE,
        SimpleModelPermissions.DELETE,
        SimpleModelPermissions.ADD,
    ]

    for perm in permissions_to_add:
        # Split the enum value to get the codename without the app label
        codename = perm.value.split(".")[-1]
        # Generate a human-readable name for the permission
        name = "Can " + perm.name.lower().replace("_", " ") + " simplemodel"

        Permission.objects.get_or_create(
            codename=codename,
            defaults={
                "name": name,
                "content_type": SimpleModelContentType,
            },
        )


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("auth", "0012_alter_user_first_name_max_length"),
        ("contenttypes", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="SimpleModel",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=255)),
            ],
        ),
        migrations.RunPython(create_permissions_if_not_exist),
        migrations.CreateModel(
            name="SimpleModelUserObjectPermission",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "content_object",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="common.simplemodel",
                    ),
                ),
                (
                    "permission",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="auth.permission",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "abstract": False,
                "unique_together": {("user", "permission", "content_object")},
            },
        ),
        migrations.CreateModel(
            name="SimpleModelGroupObjectPermission",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "content_object",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="common.simplemodel",
                    ),
                ),
                (
                    "group",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="auth.group"
                    ),
                ),
                (
                    "permission",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="auth.permission",
                    ),
                ),
            ],
            options={
                "abstract": False,
                "unique_together": {("group", "permission", "content_object")},
            },
        ),
    ]

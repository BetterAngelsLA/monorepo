# Generated by Django 5.0.5 on 2024-05-07 17:56

import common.enums

from common.permissions.enums import AttachmentPermissions, LocationPermissions
import common.utils
import django.contrib.gis.db.models.fields
import django.db.models.deletion
import django_choices_field.fields
from django.conf import settings
from django.db import migrations, models


def create_permissions_if_not_exist(apps, schema_editor):
    Permission = apps.get_model("auth", "Permission")
    ContentType = apps.get_model("contenttypes", "ContentType")
    db_alias = schema_editor.connection.alias

    Attachment = apps.get_model("common", "Attachment")
    AttachmentContentType = ContentType.objects.get_for_model(Attachment)
    ATTACHMENT_PERM_MAP = {perm.split(".")[1]: perm.label for perm in AttachmentPermissions}

    for codename, name in ATTACHMENT_PERM_MAP.items():
        cur_perm = Permission.objects.using(db_alias).create(
            codename=codename,
            content_type=AttachmentContentType,
        )
        cur_perm.name = name
        cur_perm.save()

    Location = apps.get_model("common", "Location")
    LocationContentType = ContentType.objects.get_for_model(Location)
    LOCATION_PERM_MAP = {perm.split(".")[1]: perm.label for perm in LocationPermissions}

    for codename, name in LOCATION_PERM_MAP.items():
        cur_perm = Permission.objects.using(db_alias).create(
            codename=codename,
            content_type=LocationContentType,
        )
        cur_perm.name = name
        cur_perm.save()


def update_caseworker_permission_template(apps, schema_editor):
    PermissionGroupTemplate = apps.get_model("accounts", "PermissionGroupTemplate")
    Permission = apps.get_model("auth", "Permission")
    ContentType = apps.get_model("contenttypes", "ContentType")
    caseworker_template = PermissionGroupTemplate.objects.get(name="Caseworker")

    Attachment = apps.get_model("common", "Attachment")
    AttachmentContentType = ContentType.objects.get_for_model(Attachment)

    Location = apps.get_model("common", "Location")
    LocationContentType = ContentType.objects.get_for_model(Location)

    perm_map = [
        perm.split(".")[1]
        for perm in [
            "common.add_attachment",
        ]
    ]
    permissions = list(Permission.objects.filter(codename__in=perm_map, content_type=AttachmentContentType))

    perm_map = [
        perm.split(".")[1]
        for perm in [
            "common.add_location",
            "common.view_location",
        ]
    ]
    permissions.extend(Permission.objects.filter(codename__in=perm_map, content_type=LocationContentType))

    caseworker_template.permissions.add(*permissions)


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("accounts", "0008_permissiongrouptemplate_permissiongroup"),
        ("auth", "0012_alter_user_first_name_max_length"),
        ("contenttypes", "0001_initial"),
        ("contenttypes", "0002_remove_content_type_name"),
        ("post_office", "0011_models_help_text"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Attachment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("file", models.FileField(upload_to=common.utils.get_unique_file_path)),
                (
                    "attachment_type",
                    django_choices_field.fields.TextChoicesField(
                        choices=[
                            ("image", "Image"),
                            ("document", "Document"),
                            ("audio", "Audio"),
                            ("video", "Video"),
                            ("unknown", "Unknown"),
                        ],
                        choices_enum=common.enums.AttachmentType,
                        max_length=8,
                    ),
                ),
                ("original_filename", models.CharField(blank=True, max_length=255, null=True)),
                ("object_id", models.PositiveIntegerField()),
                ("namespace", models.CharField(blank=True, max_length=255, null=True)),
                (
                    "associated_with",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="associated_attachments",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "content_type",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="contenttypes.contenttype"),
                ),
                (
                    "uploaded_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="uploaded_attachments",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="AttachmentGroupObjectPermission",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "content_object",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="common.attachment"),
                ),
                ("group", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="auth.group")),
                ("permission", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="auth.permission")),
            ],
            options={
                "abstract": False,
                "unique_together": {("group", "permission", "content_object")},
            },
        ),
        migrations.CreateModel(
            name="AttachmentUserObjectPermission",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "content_object",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="common.attachment"),
                ),
                ("permission", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="auth.permission")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "abstract": False,
                "unique_together": {("user", "permission", "content_object")},
            },
        ),
        migrations.AddIndex(
            model_name="attachment",
            index=models.Index(
                fields=["object_id", "content_type_id", "namespace", "attachment_type"], name="attachment_comp_idx"
            ),
        ),
        migrations.CreateModel(
            name="Address",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("street", models.CharField(blank=True, max_length=255, null=True)),
                ("city", models.CharField(blank=True, max_length=100, null=True)),
                ("state", models.CharField(blank=True, max_length=100, null=True)),
                ("zip_code", models.CharField(blank=True, max_length=10, null=True)),
                ("address_components", models.JSONField(blank=True, null=True)),
                ("formatted_address", models.CharField(blank=True, max_length=255, null=True)),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.AddIndex(
            model_name="address",
            index=models.Index(
                fields=["street", "city", "state", "zip_code", "address_components", "formatted_address"],
                name="address_index",
            ),
        ),
        migrations.CreateModel(
            name="Location",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "point",
                    django.contrib.gis.db.models.fields.PointField(blank=True, geography=True, null=True, srid=4326),
                ),
                ("point_of_interest", models.CharField(blank=True, max_length=255, null=True)),
                (
                    "address",
                    models.ForeignKey(
                        blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="common.address"
                    ),
                ),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.CreateModel(
            name="LocationUserObjectPermission",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "content_object",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="common.location"),
                ),
                ("permission", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="auth.permission")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "abstract": False,
                "unique_together": {("user", "permission", "content_object")},
            },
        ),
        migrations.CreateModel(
            name="LocationGroupObjectPermission",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "content_object",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="common.location"),
                ),
                ("group", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="auth.group")),
                ("permission", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="auth.permission")),
            ],
            options={
                "abstract": False,
                "unique_together": {("group", "permission", "content_object")},
            },
        ),
        migrations.RunPython(create_permissions_if_not_exist),
        migrations.RunPython(update_caseworker_permission_template),
    ]

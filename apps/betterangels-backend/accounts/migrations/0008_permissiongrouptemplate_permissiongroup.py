# Generated by Django 4.2.9 on 2024-02-08 22:59

from django.db import migrations, models
import django.db.models.deletion


def create_caseworker_permission_template(apps, schema_editor):
    PermissionGroupTemplate = apps.get_model("accounts", "PermissionGroupTemplate")
    PermissionGroupTemplate.objects.create(name="Caseworker")


class Migration(migrations.Migration):
    dependencies = [
        ("organizations", "0006_alter_organization_slug"),
        ("auth", "0012_alter_user_first_name_max_length"),
        ("accounts", "0007_add_caseworker_role"),
    ]

    operations = [
        migrations.CreateModel(
            name="PermissionGroupTemplate",
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
                (
                    "permissions",
                    models.ManyToManyField(blank=True, to="auth.permission"),
                ),
            ],
        ),
        migrations.CreateModel(
            name="PermissionGroup",
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
                ("name", models.CharField(blank=True, max_length=255)),
                (
                    "group",
                    models.OneToOneField(
                        blank=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        to="auth.group",
                    ),
                ),
                (
                    "organization",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="permission_groups",
                        to="organizations.organization",
                    ),
                ),
                (
                    "template",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="accounts.permissiongrouptemplate",
                    ),
                ),
            ],
            options={
                "unique_together": {("organization", "group")},
            },
        ),
        migrations.RunPython(create_caseworker_permission_template),
    ]

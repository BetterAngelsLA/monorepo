from django.db import migrations, models
import django.db.models.deletion


def create_caseworker_permission_template(apps, schema_editor):
    PermissionGroupTemplate = apps.get_model("accounts", "PermissionGroupTemplate")
    Permission = apps.get_model("auth", "Permission")
    caseworker_template = PermissionGroupTemplate.objects.create(name="Caseworker")

    perm_map = [
        perm.split(".")[1]
        for perm in [
            "notes.view_note",
            "notes.change_note",
            "notes.delete_note",
            "notes.add_note",
        ]
    ]

    permission = Permission.objects.filter(codename__in=perm_map)
    caseworker_template.permissions.set(permission)


def delete_caseworker_permission_template(apps, schema_editor):
    PermissionGroupTemplate = apps.get_model("accounts", "PermissionGroupTemplate")
    PermissionGroupTemplate.objects.get(name="Caseworker").delete()


def delete_old_caseworker_group(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    caseworker_group = Group.objects.get(name="Caseworker")
    caseworker_group.delete()


def delete_all_notes(apps, schema_editor):
    Note = apps.get_model("notes", "Note")
    Note.objects.all().delete()


class Migration(migrations.Migration):
    dependencies = [
        ("organizations", "0006_alter_organization_slug"),
        ("notes", "0004_alter_notegroupobjectpermission_content_object_and_more"),
    ]

    operations = [
        migrations.RunPython(delete_old_caseworker_group),
        migrations.RunPython(delete_all_notes),
        migrations.RunPython(
            create_caseworker_permission_template, delete_caseworker_permission_template
        ),
        migrations.AddField(
            model_name="note",
            name="organization",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                to="organizations.organization",
            ),
            preserve_default=False,
        ),
    ]

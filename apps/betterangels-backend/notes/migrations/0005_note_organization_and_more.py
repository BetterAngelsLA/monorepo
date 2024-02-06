from django.db import migrations, models
import django.db.models.deletion


def delete_all_notes(apps, schema_editor):
    # This should be safe, we do not have any production notes at the moment.
    # If we don't do this then we have a more complex migration to set a default org
    Note = apps.get_model("notes", "Note")
    Note.objects.all().delete()


class Migration(migrations.Migration):
    dependencies = [
        ("organizations", "0006_alter_organization_slug"),
        ("notes", "0004_add_casemanager_permission_group_template"),
    ]

    operations = [
        migrations.RunPython(delete_all_notes, reverse_code=migrations.RunPython.noop),
        migrations.AddField(
            model_name="note",
            name="organization",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                to="organizations.organization",
            ),
        ),
        migrations.AlterField(
            model_name="notegroupobjectpermission",
            name="content_object",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE, to="notes.note"
            ),
        ),
        migrations.AlterField(
            model_name="noteuserobjectpermission",
            name="content_object",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE, to="notes.note"
            ),
        ),
    ]

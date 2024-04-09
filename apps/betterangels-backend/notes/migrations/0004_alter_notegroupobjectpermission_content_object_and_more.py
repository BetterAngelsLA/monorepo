# Generated by Django 4.2.9 on 2024-02-09 02:21

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("notes", "0003_add_casemanager_note_permissions"),
    ]

    operations = [
        migrations.AlterField(
            model_name="notegroupobjectpermission",
            name="content_object",
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="notes.note"),
        ),
        migrations.AlterField(
            model_name="noteuserobjectpermission",
            name="content_object",
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="notes.note"),
        ),
    ]

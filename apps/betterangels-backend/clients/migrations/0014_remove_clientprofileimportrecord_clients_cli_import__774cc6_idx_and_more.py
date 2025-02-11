# Generated by Django 5.1.6 on 2025-02-11 21:56

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("clients", "0013_rename_profiledataimport_clientprofiledataimport_and_more"),
    ]

    operations = [
        migrations.RemoveIndex(
            model_name="clientprofileimportrecord",
            name="clients_cli_import__774cc6_idx",
        ),
        migrations.AlterUniqueTogether(
            name="clientprofileimportrecord",
            unique_together=set(),
        ),
        migrations.AddField(
            model_name="clientprofileimportrecord",
            name="source_name",
            field=models.CharField(default="", max_length=255),
            preserve_default=False,
        ),
        migrations.AddIndex(
            model_name="clientprofileimportrecord",
            index=models.Index(
                fields=["import_job", "success", "source_name", "source_id"], name="clients_cli_import__dad092_idx"
            ),
        ),
    ]

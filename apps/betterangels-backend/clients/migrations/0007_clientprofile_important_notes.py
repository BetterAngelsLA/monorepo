# Generated by Django 5.1.1 on 2024-10-04 17:36

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("clients", "0006_alter_clientprofile_preferred_communication"),
    ]

    operations = [
        migrations.AddField(
            model_name="clientprofile",
            name="important_notes",
            field=models.TextField(blank=True, null=True),
        ),
    ]

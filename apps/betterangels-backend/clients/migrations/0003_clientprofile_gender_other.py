# Generated by Django 5.1.1 on 2024-09-19 18:57

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("clients", "0002_clientprofile_contact_info"),
    ]

    operations = [
        migrations.AddField(
            model_name="clientprofile",
            name="gender_other",
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
    ]

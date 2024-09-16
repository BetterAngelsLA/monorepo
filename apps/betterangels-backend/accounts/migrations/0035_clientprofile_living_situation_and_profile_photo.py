# Generated by Django 5.0.7 on 2024-09-12 20:03

import accounts.enums
import accounts.models
import django_choices_field.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0034_clientprofile_clientcontact_clear_phonenumber"),
    ]

    operations = [
        migrations.AddField(
            model_name="clientprofile",
            name="living_situation",
            field=django_choices_field.fields.TextChoicesField(
                blank=True,
                choices=[
                    ("housing", "Housing"),
                    ("open_air", "Open Air"),
                    ("shelter", "Shelter"),
                    ("tent", "Tent"),
                    ("vehicle", "Vehicle"),
                    ("other", "Other"),
                ],
                choices_enum=accounts.enums.LivingSituationEnum,
                max_length=8,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="clientprofile",
            name="profile_photo",
            field=models.ImageField(
                blank=True, null=True, upload_to=accounts.models.get_client_profile_photo_file_path
            ),
        ),
    ]

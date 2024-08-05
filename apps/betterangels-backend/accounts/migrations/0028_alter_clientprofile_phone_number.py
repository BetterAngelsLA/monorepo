# Generated by Django 5.0.7 on 2024-08-05 22:38

import accounts.models
import phonenumber_field.modelfields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0027_alter_clientprofile_phone_number"),
    ]

    operations = [
        migrations.AlterField(
            model_name="clientprofile",
            name="phone_number",
            field=models.JSONField(
                blank=True,
                default=accounts.models.phone_number_field_default_value,
                null=True,
                verbose_name=phonenumber_field.modelfields.PhoneNumberField(max_length=128, region="US"),
            ),
        ),
    ]

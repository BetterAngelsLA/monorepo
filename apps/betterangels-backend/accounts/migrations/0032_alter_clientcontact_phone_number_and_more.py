# Generated by Django 5.0.7 on 2024-08-21 17:23

import phonenumber_field.modelfields
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0031_clientcontact_demo_fields"),
    ]

    operations = [
        migrations.AlterField(
            model_name="clientcontact",
            name="phone_number",
            field=phonenumber_field.modelfields.PhoneNumberField(blank=True, max_length=128, null=True, region="US"),
        ),
        migrations.AlterField(
            model_name="clientprofile",
            name="phone_number",
            field=phonenumber_field.modelfields.PhoneNumberField(blank=True, max_length=128, null=True, region="US"),
        ),
    ]
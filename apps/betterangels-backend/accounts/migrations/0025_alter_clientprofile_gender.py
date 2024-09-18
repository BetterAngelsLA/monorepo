# Generated by Django 5.0.6 on 2024-07-23 05:56

import clients.enums
import django_choices_field.fields
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0024_remove_user_user_add_insert_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="clientprofile",
            name="gender",
            field=django_choices_field.fields.TextChoicesField(
                blank=True,
                choices=[
                    ("male", "Male"),
                    ("female", "Female"),
                    ("non_binary", "Non-binary"),
                    ("other", "Other"),
                    ("prefer_not_to_say", "Prefer not to say"),
                ],
                choices_enum=clients.enums.GenderEnum,
                max_length=17,
                null=True,
            ),
        ),
    ]

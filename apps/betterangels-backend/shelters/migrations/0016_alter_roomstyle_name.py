# Generated by Django 5.1.6 on 2025-03-14 23:57

import django_choices_field.fields
import shelters.enums
from django.db import migrations


def update_enum_values_forward(apps, schema_editor):
    # Use raw SQL to update the enum values directly in the database
    schema_editor.execute("UPDATE shelters_roomstyle SET name = 'congregate' WHERE name = 'congregant'")


class Migration(migrations.Migration):

    dependencies = [
        ("shelters", "0015_exitpolicy_mealservice_referralrequirement_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="roomstyle",
            name="name",
            field=django_choices_field.fields.TextChoicesField(
                blank=True,
                choices=[
                    ("congregate", "Congregate (Open)"),
                    ("cubicle_low_walls", "Cubicle (Low Walls)"),
                    ("cubicle_high_walls", "Cubicle (High Walls)"),
                    ("high_bunk", "High Bunk"),
                    ("low_bunk", "Low Bunk"),
                    ("shared_rooms", "Shared Rooms"),
                    ("single_room", "Single Room"),
                    ("motel_room", "Motel Room"),
                    ("other", "Other"),
                ],
                choices_enum=shelters.enums.RoomStyleChoices,
                max_length=18,
                null=True,
                unique=True,
            ),
        ),
        migrations.RunPython(update_enum_values_forward),
    ]

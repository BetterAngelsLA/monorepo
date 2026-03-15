import django_choices_field.fields
from django.db import migrations
import shelters.enums


class Migration(migrations.Migration):

    dependencies = [
        ("shelters", "0035_update_bed_attributes"),
    ]

    operations = [
        migrations.AlterField(
            model_name="bed",
            name="status",
            field=django_choices_field.fields.TextChoicesField(
                blank=True,
                choices=[
                    ("available", "Available"),
                    ("occupied", "Occupied"),
                    ("reserved", "Reserved"),
                    ("out_of_service", "Out-of-Service"),
                ],
                choices_enum=shelters.enums.BedStatusChoices,
                max_length=14,
                null=True,
            ),
        ),
        migrations.AlterField(
            model_name="pet",
            name="name",
            field=django_choices_field.fields.TextChoicesField(
                blank=True,
                choices=[
                    ("cats", "Cats"),
                    ("dogs_under_25_lbs", "Dogs (< 25 lbs)"),
                    ("dogs_over_25_lbs", "Dogs (> 25 lbs)"),
                    ("exotics", "Exotics"),
                    ("service_animals", "Service Animals"),
                    ("pet_area", "Pet Area"),
                    ("no_pets_allowed", "No Pets Allowed"),
                ],
                choices_enum=shelters.enums.PetChoices,
                max_length=17,
                null=True,
                unique=True,
            ),
        ),
    ]

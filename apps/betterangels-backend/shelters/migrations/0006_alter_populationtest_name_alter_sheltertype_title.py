# Generated by Django 5.0.6 on 2024-07-09 22:40

import django_choices_field.fields
import shelters.enums
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("shelters", "0005_populationtest_remove_shelter_average_bed_rate_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="populationtest",
            name="name",
            field=django_choices_field.fields.TextChoicesField(
                choices=[
                    ("Adults", "Adults"),
                    ("Men", "Men"),
                    ("Women", "Women"),
                    ("Families", "Families"),
                    ("Youth (TAY)", "Youth (TAY)"),
                    ("Boys", "Boys"),
                    ("Girls", "Girls"),
                    ("Seniors (55+)", "Seniors (55+)"),
                    ("Veterans", "Veterans"),
                    ("LGBTQ", "LGBTQ"),
                    ("HIV/AIDS", "HIV/AIDS"),
                ],
                choices_enum=shelters.enums.PopulationEnum,
                max_length=13,
            ),
        ),
        migrations.AlterField(
            model_name="sheltertype",
            name="title",
            field=django_choices_field.fields.TextChoicesField(
                choices=[
                    ("Faith Based", "Faith Based"),
                    ("Interim Housing", "Interim Housing"),
                    ("Permanent Housing", "Permanent Housing"),
                    ("A Bridge Home", "A Bridge Home"),
                    ("Project Home Key (PHK)", "Project Home Key (PHK)"),
                    ("Tiny Home Village", "Tiny Home Village"),
                    ("Winter Shelter", "Winter Shelter"),
                    ("Emergency Shelter", "Emergency Shelter"),
                    ("Crisis Housing", "Crisis Housing"),
                    ("Recuperative Care", "Recuperative Care"),
                    ("Transitional Housing", "Transitional Housing"),
                    ("Roadmap Home", "Roadmap Home"),
                    ("Rapid Rehousing", "Rapid Rehousing"),
                    ("Sober Living", "Sober Living"),
                    ("Safe Park LA", "Safe Park LA"),
                ],
                choices_enum=shelters.enums.ShelterTypeEnum,
                max_length=22,
            ),
        ),
    ]

# Generated by Django 4.2.11 on 2024-04-08 21:50

import django.contrib.gis.db.models.fields
from django.db import migrations, models
import django.db.models.deletion
import django_choices_field.fields
import shelters.enums


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Location",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "point",
                    django.contrib.gis.db.models.fields.PointField(blank=True, geography=True, null=True, srid=4326),
                ),
                ("address", models.CharField(max_length=255)),
                ("city", models.CharField(blank=True, max_length=100, null=True)),
                ("state", models.CharField(blank=True, max_length=100, null=True)),
                ("zip_code", models.CharField(blank=True, max_length=50, null=True)),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.CreateModel(
            name="Shelter",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("title", models.CharField(max_length=255)),
                ("image_url", models.URLField(blank=True, null=True)),
                ("spa", models.PositiveSmallIntegerField(blank=True, null=True)),
                ("confidential", models.BooleanField(blank=True, null=True)),
                ("email", models.EmailField(blank=True, max_length=254, null=True)),
                ("phone", models.CharField(blank=True, default="", max_length=20)),
                ("website", models.URLField(blank=True, null=True)),
                ("description", models.TextField(blank=True, null=True)),
                ("typical_stay_description", models.TextField(blank=True, null=True)),
                ("total_beds", models.PositiveIntegerField(blank=True, null=True)),
                ("available_beds", models.PositiveIntegerField(blank=True, null=True)),
                ("private_beds", models.PositiveIntegerField(blank=True, null=True)),
                ("max_stay", models.PositiveIntegerField(blank=True, null=True)),
                (
                    "average_bed_rate",
                    models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True),
                ),
                ("bed_layout_description", models.TextField(blank=True, null=True)),
                (
                    "location",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="shelter",
                        to="shelters.location",
                    ),
                ),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.CreateModel(
            name="ShelterType",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "title",
                    django_choices_field.fields.TextChoicesField(
                        choices=[
                            ("Interim Housing", "Interim Housing"),
                            ("Permanent Housing", "Permanent Housing"),
                            ("A Bridge Home (ABH)", "A Bridge Home"),
                            ("Project Homekey (PHK)", "Project Homekey (PHK)"),
                            ("Tiny Home Village", "Tiny Home Village"),
                            ("Winter Shelter", "Winter Shelter"),
                            ("Emergency Shelter", "Emergency Shelter"),
                            ("Crisis Housing", "Crisis Housing"),
                            ("Recuperative Care", "Recuperative Care"),
                            ("Transitional Housing", "Transitional Housing"),
                            ("Roadmap Home", "Roadmap Home"),
                            ("Rapid Re-housing", "Rapid Re-housing"),
                            ("Sober Living", "Sober Living"),
                        ],
                        choices_enum=shelters.enums.ShelterTypeEnum,
                        max_length=21,
                    ),
                ),
                (
                    "shelter",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="shelter_type",
                        to="shelters.shelter",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Service",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "title",
                    django_choices_field.fields.TextChoicesField(
                        choices=[
                            ("Food", "Food"),
                            ("Showers", "Showers"),
                            ("Clothing", "Clothing"),
                            ("Mail", "Mail"),
                            ("Phone", "Phone"),
                            ("Computers", "Computes"),
                            ("Job Training", "Job Training"),
                            ("Tutoring", "Tutoring"),
                            ("Life Skills Training", "Life Skills Training"),
                            ("Medical Services", "Medical Services"),
                            ("Mental Health", "Mental Health"),
                            ("Drug Treatment", "Drug Treatment"),
                            ("Financial Planning", "Financial Planning"),
                            ("Legal Assistance", "Legal Assistance"),
                            ("Transportation", "Transportation"),
                        ],
                        choices_enum=shelters.enums.ServiceEnum,
                        max_length=20,
                    ),
                ),
                (
                    "shelter",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="services",
                        to="shelters.shelter",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Requirement",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "title",
                    django_choices_field.fields.TextChoicesField(
                        choices=[
                            ("Photo ID", "Photo ID"),
                            ("Medicaid or Medicare", "Medicaid or Medicare"),
                            ("Veteran", "Veteran"),
                            ("Reservation", "Reservation"),
                            ("Referral", "Referral"),
                        ],
                        choices_enum=shelters.enums.RequirementEnum,
                        max_length=20,
                    ),
                ),
                (
                    "shelter",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="requirements",
                        to="shelters.shelter",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Population",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "title",
                    django_choices_field.fields.TextChoicesField(
                        choices=[
                            ("Adults", "Adults"),
                            ("Men", "Men"),
                            ("Women", "Women"),
                            ("Families", "Families"),
                            ("Youth", "Youth"),
                            ("Boys", "Boys"),
                            ("Girls", "Girls"),
                            ("Seniors", "Seniors"),
                            ("Veterans", "Veterans"),
                            ("LGBTQ", "LGBTQ"),
                        ],
                        choices_enum=shelters.enums.PopulationEnum,
                        max_length=8,
                    ),
                ),
                (
                    "shelter",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="populations",
                        to="shelters.shelter",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="HowToEnter",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "title",
                    django_choices_field.fields.TextChoicesField(
                        choices=[
                            ("Call", "Call"),
                            ("Referral", "Referral"),
                            ("Walk-In", "Walk-In"),
                        ],
                        choices_enum=shelters.enums.HowToEnterEnum,
                        max_length=8,
                    ),
                ),
                (
                    "shelter",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="how_to_enter",
                        to="shelters.shelter",
                    ),
                ),
            ],
        ),
    ]

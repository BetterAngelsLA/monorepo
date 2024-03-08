# Generated by Django 4.2.9 on 2024-03-08 17:40

from django.db import migrations, models
import django.db.models.deletion
import django_choices_field.fields
import shelters.enums


class Migration(migrations.Migration):
    dependencies = [
        ("shelters", "0006_alter_shelter_average_bed_rate_and_more"),
    ]

    operations = [
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
            ],
        ),
        migrations.AddField(
            model_name="shelter",
            name="shelter_type",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                to="shelters.sheltertype",
            ),
        ),
    ]

import django.db.models.deletion
import django_choices_field.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("shelters", "0028_add_shelter_status_index"),
    ]

    operations = [
        migrations.CreateModel(
            name="Room",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("room_identifier", models.CharField(max_length=255)),
                (
                    "room_type",
                    django_choices_field.fields.TextChoicesField(
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
                        max_length=18,
                        null=True,
                    ),
                ),
                ("room_type_other", models.CharField(blank=True, max_length=255, null=True)),
                (
                    "status",
                    django_choices_field.fields.TextChoicesField(
                        blank=True,
                        choices=[
                            ("available", "Available"),
                            ("reserved", "Reserved"),
                            ("needs_maintenance", "Needs Maintenance"),
                        ],
                        max_length=17,
                        null=True,
                    ),
                ),
                ("notes", models.TextField(blank=True, null=True)),
                ("amenities", models.TextField(blank=True, null=True)),
                ("medical_respite", models.BooleanField(blank=True, default=False)),
                ("last_cleaned_inspected", models.DateTimeField(blank=True, null=True)),
                (
                    "shelter",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="rooms", to="shelters.shelter"
                    ),
                ),
            ],
            options={
                "indexes": [models.Index(fields=["shelter", "status"], name="shelters_ro_shelter_d19bd5_idx")],
                "constraints": [
                    models.UniqueConstraint(fields=("shelter", "room_identifier"), name="unique_room_per_shelter")
                ],
            },
        ),
        migrations.RemoveIndex(
            model_name="bed",
            name="shelters_be_shelter_eaa435_idx",
        ),
        migrations.RenameField(
            model_name="bed",
            old_name="shelter_id",
            new_name="shelter",
        ),
        migrations.AlterField(
            model_name="bed",
            name="shelter",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE, related_name="beds", to="shelters.shelter"
            ),
        ),
        migrations.AddIndex(
            model_name="bed",
            index=models.Index(fields=["shelter", "status"], name="shelters_be_shelter_cd7c2c_idx"),
        ),
    ]

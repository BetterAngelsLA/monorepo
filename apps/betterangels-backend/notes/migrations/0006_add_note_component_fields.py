# Generated by Django 4.2.10 on 2024-02-15 18:45

from django.conf import settings
import django.contrib.gis.db.models.fields
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone
import django_choices_field.fields
import notes.enums
import simple_history.models
from django.utils.translation import gettext_lazy as _


class ServiceTypeEnum(models.TextChoices):
    PROVIDED = "provided", _("Provided")
    REQUESTED = "requested", _("Requested")


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("organizations", "0006_alter_organization_slug"),
        ("notes", "0005_alter_note_options_note_organization_and_more"),
    ]

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
                ("point", django.contrib.gis.db.models.fields.PointField(srid=4326)),
                ("address", models.CharField(blank=True, max_length=255)),
                ("city", models.CharField(blank=True, max_length=100)),
                ("state", models.CharField(blank=True, max_length=100)),
                ("zip_code", models.CharField(blank=True, max_length=50)),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.RemoveField(
            model_name="note",
            name="body",
        ),
        migrations.AddField(
            model_name="note",
            name="client",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="client_notes",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="note",
            name="is_submitted",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="note",
            name="private_details",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="note",
            name="public_details",
            field=models.TextField(null=True),
        ),
        migrations.AddField(
            model_name="note",
            name="timestamp",
            field=models.DateTimeField(
                auto_now_add=True, default=django.utils.timezone.now
            ),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name="note",
            name="created_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="notes",
                to=settings.AUTH_USER_MODEL,
            ),
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
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "descriptor",
                    django_choices_field.fields.TextChoicesField(
                        choices=[
                            ("blanket", "Blanket"),
                            ("book", "Book"),
                            ("clothes", "Clothes"),
                            ("dental", "Dental"),
                            ("food", "Food"),
                            ("harm_reduction", "Harm Reduction"),
                            ("hygiene_kit", "Hygiene Kit"),
                            ("medical", "Medical"),
                            ("pet_care", "Pet Care"),
                            ("pet_food", "Pet Food"),
                            ("shelter", "Shelter"),
                            ("shoes", "Shoes"),
                            ("shower", "Shower"),
                            ("stabilize", "Stabilize"),
                            ("storage", "Storage"),
                            ("transport", "Transport"),
                            ("water", "Water"),
                            ("other", "Other"),
                        ],
                        choices_enum=notes.enums.ServiceEnum,
                        max_length=14,
                    ),
                ),
                ("custom_descriptor", models.CharField(blank=True, max_length=100)),
                (
                    "service_type",
                    django_choices_field.fields.TextChoicesField(
                        choices=[("provided", "Provided"), ("requested", "Requested")],
                        choices_enum=ServiceTypeEnum,
                        max_length=9,
                    ),
                ),
                (
                    "note",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="services",
                        to="notes.note",
                    ),
                ),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.CreateModel(
            name="Mood",
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
                    "descriptor",
                    django_choices_field.fields.TextChoicesField(
                        choices=[
                            ("agitated", "Agitated"),
                            ("agreeable", "Agreeable"),
                            ("anxious", "Anxious"),
                            ("depressed", "Depressed"),
                            ("detached", "Detached"),
                            ("disorganized_thought", "Disorganized Thought"),
                            ("disoriented", "Disoriented"),
                            ("escalated", "Escalated"),
                            ("euthymic", "Euthymic"),
                            ("flat_blunted", "Flat/blunted"),
                            ("happy", "Happy"),
                            ("hopeless", "Hopeless"),
                            ("indifferent", "Indifferent"),
                            ("manic", "Manic"),
                            ("motivated", "Motivated"),
                            ("optimistic", "Optimistic"),
                            ("personable", "Personable"),
                            ("pleasant", "Pleasant"),
                            ("restless", "Restless"),
                            ("suicidal", "Suicidal"),
                        ],
                        choices_enum=notes.enums.MoodEnum,
                        max_length=20,
                    ),
                ),
                (
                    "note",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="moods",
                        to="notes.note",
                    ),
                ),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.CreateModel(
            name="HistoricalNote",
            fields=[
                (
                    "id",
                    models.BigIntegerField(
                        auto_created=True, blank=True, db_index=True, verbose_name="ID"
                    ),
                ),
                ("created_at", models.DateTimeField(blank=True, editable=False)),
                ("updated_at", models.DateTimeField(blank=True, editable=False)),
                ("title", models.CharField(max_length=100)),
                ("timestamp", models.DateTimeField(blank=True, editable=False)),
                ("public_details", models.TextField(null=True)),
                ("private_details", models.TextField(blank=True)),
                ("is_submitted", models.BooleanField(default=False)),
                ("history_id", models.AutoField(primary_key=True, serialize=False)),
                ("history_date", models.DateTimeField(db_index=True)),
                ("history_change_reason", models.CharField(max_length=100, null=True)),
                (
                    "history_type",
                    models.CharField(
                        choices=[("+", "Created"), ("~", "Changed"), ("-", "Deleted")],
                        max_length=1,
                    ),
                ),
                (
                    "client",
                    models.ForeignKey(
                        blank=True,
                        db_constraint=False,
                        null=True,
                        on_delete=django.db.models.deletion.DO_NOTHING,
                        related_name="+",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        db_constraint=False,
                        null=True,
                        on_delete=django.db.models.deletion.DO_NOTHING,
                        related_name="+",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "history_user",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="+",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "location",
                    models.ForeignKey(
                        blank=True,
                        db_constraint=False,
                        null=True,
                        on_delete=django.db.models.deletion.DO_NOTHING,
                        related_name="+",
                        to="notes.location",
                    ),
                ),
                (
                    "organization",
                    models.ForeignKey(
                        blank=True,
                        db_constraint=False,
                        null=True,
                        on_delete=django.db.models.deletion.DO_NOTHING,
                        related_name="+",
                        to="organizations.organization",
                    ),
                ),
            ],
            options={
                "verbose_name": "historical note",
                "verbose_name_plural": "historical notes",
                "ordering": ("-history_date", "-history_id"),
                "get_latest_by": ("history_date", "history_id"),
            },
            bases=(simple_history.models.HistoricalChanges, models.Model),
        ),
        migrations.AddField(
            model_name="note",
            name="location",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="notes",
                to="notes.location",
            ),
        ),
    ]

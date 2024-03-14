# Generated by Django 4.2.11 on 2024-03-14 21:45

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django_choices_field.fields
import notes.enums
import simple_history.models


class Migration(migrations.Migration):
    dependencies = [
        ("auth", "0012_alter_user_first_name_max_length"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("notes", "0011_add_casemanager_task_permissions"),
    ]

    operations = [
        migrations.CreateModel(
            name="HistoricalServiceRequest",
            fields=[
                (
                    "id",
                    models.BigIntegerField(
                        auto_created=True, blank=True, db_index=True, verbose_name="ID"
                    ),
                ),
                ("created_at", models.DateTimeField(blank=True, editable=False)),
                ("updated_at", models.DateTimeField(blank=True, editable=False)),
                (
                    "service",
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
                (
                    "custom_service",
                    models.CharField(blank=True, max_length=100, null=True),
                ),
                (
                    "status",
                    django_choices_field.fields.TextChoicesField(
                        choices=[("completed", "Completed"), ("to_do", "To Do")],
                        choices_enum=notes.enums.ServiceRequestStatusEnum,
                        max_length=9,
                    ),
                ),
                ("due_by", models.DateTimeField(blank=True, null=True)),
                ("completed_on", models.DateTimeField(blank=True, null=True)),
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
            ],
            options={
                "verbose_name": "historical service request",
                "verbose_name_plural": "historical service requests",
                "ordering": ("-history_date", "-history_id"),
                "get_latest_by": ("history_date", "history_id"),
            },
            bases=(simple_history.models.HistoricalChanges, models.Model),
        ),
        migrations.CreateModel(
            name="ServiceRequest",
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
                    "service",
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
                (
                    "custom_service",
                    models.CharField(blank=True, max_length=100, null=True),
                ),
                (
                    "status",
                    django_choices_field.fields.TextChoicesField(
                        choices=[("completed", "Completed"), ("to_do", "To Do")],
                        choices_enum=notes.enums.ServiceRequestStatusEnum,
                        max_length=9,
                    ),
                ),
                ("due_by", models.DateTimeField(blank=True, null=True)),
                ("completed_on", models.DateTimeField(blank=True, null=True)),
                (
                    "client",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="client_service_requests",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="service_requests",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.CreateModel(
            name="ServiceRequestGroupObjectPermission",
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
                    "content_object",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="notes.servicerequest",
                    ),
                ),
                (
                    "group",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="auth.group"
                    ),
                ),
                (
                    "permission",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="auth.permission",
                    ),
                ),
            ],
            options={
                "abstract": False,
                "unique_together": {("group", "permission", "content_object")},
            },
        ),
        migrations.CreateModel(
            name="ServiceRequestUserObjectPermission",
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
                    "content_object",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="notes.servicerequest",
                    ),
                ),
                (
                    "permission",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="auth.permission",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "abstract": False,
                "unique_together": {("user", "permission", "content_object")},
            },
        ),
        migrations.DeleteModel(
            name="Service",
        ),
        migrations.AddField(
            model_name="historicalservicerequest",
            name="history_relation",
            field=models.ForeignKey(
                db_constraint=False,
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name="history",
                to="notes.servicerequest",
            ),
        ),
        migrations.AddField(
            model_name="historicalservicerequest",
            name="history_user",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="+",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]

# Generated by Django 4.2.10 on 2024-02-27 06:25

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django_choices_field.fields
import notes.enums


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("notes", "0008_split_requested_and_provided_services"),
    ]

    operations = [
        migrations.CreateModel(
            name="Task",
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
                ("title", models.CharField(max_length=100)),
                (
                    "status",
                    django_choices_field.fields.TextChoicesField(
                        choices=[
                            ("canceled", "Canceled"),
                            ("completed", "Completed"),
                            ("draft_canceled", "Draft Canceled"),
                            ("draft_completed", "Draft Completed"),
                            ("in_progress", "In Progress"),
                            ("to_do", "To Do"),
                        ],
                        choices_enum=notes.enums.TaskStatusEnum,
                        max_length=15,
                    ),
                ),
                ("due_date", models.DateTimeField(blank=True, null=True)),
                (
                    "client",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="client_tasks",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="tasks",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "location",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="tasks",
                        to="notes.location",
                    ),
                ),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.AddField(
            model_name="note",
            name="child_tasks",
            field=models.ManyToManyField(
                related_name="notes_next_task", to="notes.task"
            ),
        ),
        migrations.AddField(
            model_name="note",
            name="parent_tasks",
            field=models.ManyToManyField(related_name="notes_created", to="notes.task"),
        ),
    ]

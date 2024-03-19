# Generated by Django 4.2.10 on 2024-03-11 23:20

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django_choices_field.fields
import notes.enums
import simple_history.models


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("notes", "0007_add_private_note_permissions"),
    ]

    operations = [
        migrations.AddField(
            model_name="historicalnote",
            name="history_relation",
            field=models.ForeignKey(
                db_constraint=False,
                default=0,
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name="history",
                to="notes.note",
            ),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name="mood",
            name="note",
            field=simple_history.models.HistoricForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="moods",
                to="notes.note",
            ),
        ),
        migrations.CreateModel(
            name="HistoricalMood",
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
                    "history_relation",
                    models.ForeignKey(
                        db_constraint=False,
                        on_delete=django.db.models.deletion.DO_NOTHING,
                        related_name="history",
                        to="notes.mood",
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
                    "note",
                    simple_history.models.HistoricForeignKey(
                        blank=True,
                        db_constraint=False,
                        null=True,
                        on_delete=django.db.models.deletion.DO_NOTHING,
                        related_name="+",
                        to="notes.note",
                    ),
                ),
            ],
            options={
                "verbose_name": "historical mood",
                "verbose_name_plural": "historical moods",
                "ordering": ("-history_date", "-history_id"),
                "get_latest_by": ("history_date", "history_id"),
            },
            bases=(simple_history.models.HistoricalChanges, models.Model),
        ),
    ]

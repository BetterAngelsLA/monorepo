# Generated by Django 4.2.11 on 2024-03-18 22:59

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django_choices_field.fields
import notes.enums


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("common", "0004_attachment_attachmentgroupobjectpermission_and_more"),
        ("notes", "0013_add_casemanager_service_request_permissions"),
    ]

    operations = [
        migrations.AddField(
            model_name="note",
            name="next_steps",
            field=models.ManyToManyField(related_name="next_step_notes", to="notes.task"),
        ),
        migrations.AddField(
            model_name="note",
            name="provided_services",
            field=models.ManyToManyField(related_name="provided_notes", to="notes.servicerequest"),
        ),
        migrations.AddField(
            model_name="note",
            name="purposes",
            field=models.ManyToManyField(related_name="purpose_notes", to="notes.task"),
        ),
        migrations.AddField(
            model_name="note",
            name="requested_services",
            field=models.ManyToManyField(related_name="requested_notes", to="notes.servicerequest"),
        ),
        migrations.CreateModel(
            name="HistoricalTask",
            fields=[
                (
                    "id",
                    models.BigIntegerField(auto_created=True, blank=True, db_index=True, verbose_name="ID"),
                ),
                ("created_at", models.DateTimeField(blank=True, editable=False)),
                ("updated_at", models.DateTimeField(blank=True, editable=False)),
                ("title", models.CharField(max_length=100)),
                (
                    "status",
                    django_choices_field.fields.TextChoicesField(
                        choices=[("completed", "Completed"), ("to_do", "To Do")],
                        choices_enum=notes.enums.TaskStatusEnum,
                        max_length=9,
                    ),
                ),
                ("due_by", models.DateTimeField(blank=True, null=True)),
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
                    "history_relation",
                    models.ForeignKey(
                        db_constraint=False,
                        on_delete=django.db.models.deletion.DO_NOTHING,
                        related_name="history",
                        to="notes.task",
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
                        to="common.location",
                    ),
                ),
            ],
            options={
                "verbose_name": "historical task",
                "verbose_name_plural": "historical tasks",
                "ordering": ("-history_date", "-history_id"),
                "get_latest_by": ("history_date", "history_id"),
            },
            # NOTE: simple_history dep has been deprecated
            # bases=(simple_history.models.HistoricalChanges, models.Model),
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name="HistoricalNote_purposes",
            fields=[
                (
                    "id",
                    models.BigIntegerField(auto_created=True, blank=True, db_index=True, verbose_name="ID"),
                ),
                ("m2m_history_id", models.AutoField(primary_key=True, serialize=False)),
                (
                    "history",
                    models.ForeignKey(
                        db_constraint=False,
                        on_delete=django.db.models.deletion.DO_NOTHING,
                        to="notes.historicalnote",
                    ),
                ),
                (
                    "note",
                    models.ForeignKey(
                        blank=True,
                        db_constraint=False,
                        db_tablespace="",
                        null=True,
                        on_delete=django.db.models.deletion.DO_NOTHING,
                        related_name="+",
                        to="notes.note",
                    ),
                ),
                (
                    "task",
                    models.ForeignKey(
                        blank=True,
                        db_constraint=False,
                        db_tablespace="",
                        null=True,
                        on_delete=django.db.models.deletion.DO_NOTHING,
                        related_name="+",
                        to="notes.task",
                    ),
                ),
            ],
            options={
                "verbose_name": "HistoricalNote_purposes",
            },
            # NOTE: simple_history dep has been deprecated
            # bases=(simple_history.models.HistoricalChanges, models.Model),
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name="HistoricalNote_next_steps",
            fields=[
                (
                    "id",
                    models.BigIntegerField(auto_created=True, blank=True, db_index=True, verbose_name="ID"),
                ),
                ("m2m_history_id", models.AutoField(primary_key=True, serialize=False)),
                (
                    "history",
                    models.ForeignKey(
                        db_constraint=False,
                        on_delete=django.db.models.deletion.DO_NOTHING,
                        to="notes.historicalnote",
                    ),
                ),
                (
                    "note",
                    models.ForeignKey(
                        blank=True,
                        db_constraint=False,
                        db_tablespace="",
                        null=True,
                        on_delete=django.db.models.deletion.DO_NOTHING,
                        related_name="+",
                        to="notes.note",
                    ),
                ),
                (
                    "task",
                    models.ForeignKey(
                        blank=True,
                        db_constraint=False,
                        db_tablespace="",
                        null=True,
                        on_delete=django.db.models.deletion.DO_NOTHING,
                        related_name="+",
                        to="notes.task",
                    ),
                ),
            ],
            options={
                "verbose_name": "HistoricalNote_next_steps",
            },
            # NOTE: simple_history dep has been deprecated
            # bases=(simple_history.models.HistoricalChanges, models.Model),
            bases=(models.Model,),
        ),
    ]

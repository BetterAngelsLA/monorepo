# Generated by Django 4.2.11 on 2024-03-25 22:39

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django_choices_field.fields
import notes.enums
import pgtrigger.compiler
import pgtrigger.migrations


class Migration(migrations.Migration):
    dependencies = [
        ("organizations", "0006_alter_organization_slug"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("pghistory", "0006_delete_aggregateevent"),
        ("notes", "0015_remove_historicalnote_client_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="MoodEvent",
            fields=[
                ("pgh_id", models.AutoField(primary_key=True, serialize=False)),
                ("pgh_created_at", models.DateTimeField(auto_now_add=True)),
                ("pgh_label", models.TextField(help_text="The event label.")),
                ("id", models.IntegerField()),
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
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.CreateModel(
            name="NoteEvent",
            fields=[
                ("pgh_id", models.AutoField(primary_key=True, serialize=False)),
                ("pgh_created_at", models.DateTimeField(auto_now_add=True)),
                ("pgh_label", models.TextField(help_text="The event label.")),
                ("id", models.IntegerField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("title", models.CharField(max_length=100)),
                ("timestamp", models.DateTimeField(auto_now_add=True)),
                ("public_details", models.TextField(blank=True)),
                ("private_details", models.TextField(blank=True)),
                ("is_submitted", models.BooleanField(default=False)),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.CreateModel(
            name="NoteNextStepsEvent",
            fields=[
                ("pgh_id", models.AutoField(primary_key=True, serialize=False)),
                ("pgh_created_at", models.DateTimeField(auto_now_add=True)),
                ("pgh_label", models.TextField(help_text="The event label.")),
                ("id", models.IntegerField()),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.CreateModel(
            name="NoteProvidedServicesEvent",
            fields=[
                ("pgh_id", models.AutoField(primary_key=True, serialize=False)),
                ("pgh_created_at", models.DateTimeField(auto_now_add=True)),
                ("pgh_label", models.TextField(help_text="The event label.")),
                ("id", models.IntegerField()),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.CreateModel(
            name="NotePurposesEvent",
            fields=[
                ("pgh_id", models.AutoField(primary_key=True, serialize=False)),
                ("pgh_created_at", models.DateTimeField(auto_now_add=True)),
                ("pgh_label", models.TextField(help_text="The event label.")),
                ("id", models.IntegerField()),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.CreateModel(
            name="NoteRequestedServicesEvent",
            fields=[
                ("pgh_id", models.AutoField(primary_key=True, serialize=False)),
                ("pgh_created_at", models.DateTimeField(auto_now_add=True)),
                ("pgh_label", models.TextField(help_text="The event label.")),
                ("id", models.IntegerField()),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.CreateModel(
            name="ServiceRequestEvent",
            fields=[
                ("pgh_id", models.AutoField(primary_key=True, serialize=False)),
                ("pgh_created_at", models.DateTimeField(auto_now_add=True)),
                ("pgh_label", models.TextField(help_text="The event label.")),
                ("id", models.IntegerField()),
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
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.CreateModel(
            name="TaskEvent",
            fields=[
                ("pgh_id", models.AutoField(primary_key=True, serialize=False)),
                ("pgh_created_at", models.DateTimeField(auto_now_add=True)),
                ("pgh_label", models.TextField(help_text="The event label.")),
                ("id", models.IntegerField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
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
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.CreateModel(
            name="NoteNextSteps",
            fields=[],
            options={
                "proxy": True,
                "indexes": [],
                "constraints": [],
            },
            bases=("notes.note_next_steps",),
        ),
        migrations.CreateModel(
            name="NoteProvidedServices",
            fields=[],
            options={
                "proxy": True,
                "indexes": [],
                "constraints": [],
            },
            bases=("notes.note_provided_services",),
        ),
        migrations.CreateModel(
            name="NotePurposes",
            fields=[],
            options={
                "proxy": True,
                "indexes": [],
                "constraints": [],
            },
            bases=("notes.note_purposes",),
        ),
        migrations.CreateModel(
            name="NoteRequestedServices",
            fields=[],
            options={
                "proxy": True,
                "indexes": [],
                "constraints": [],
            },
            bases=("notes.note_requested_services",),
        ),
        pgtrigger.migrations.AddTrigger(
            model_name="mood",
            trigger=pgtrigger.compiler.Trigger(
                name="mood_add_insert",
                sql=pgtrigger.compiler.UpsertTriggerSql(
                    func='INSERT INTO "notes_moodevent" ("created_at", "descriptor", "id", "note_id", "pgh_context_id", "pgh_created_at", "pgh_label", "pgh_obj_id", "updated_at") VALUES (NEW."created_at", NEW."descriptor", NEW."id", NEW."note_id", _pgh_attach_context(), NOW(), \'mood.add\', NEW."id", NEW."updated_at"); RETURN NULL;',
                    hash="464d79fe7451d66cdd2edadb7129d590bd748405",
                    operation="INSERT",
                    pgid="pgtrigger_mood_add_insert_d64e0",
                    table="notes_mood",
                    when="AFTER",
                ),
            ),
        ),
        pgtrigger.migrations.AddTrigger(
            model_name="mood",
            trigger=pgtrigger.compiler.Trigger(
                name="mood_remove_delete",
                sql=pgtrigger.compiler.UpsertTriggerSql(
                    func='INSERT INTO "notes_moodevent" ("created_at", "descriptor", "id", "note_id", "pgh_context_id", "pgh_created_at", "pgh_label", "pgh_obj_id", "updated_at") VALUES (OLD."created_at", OLD."descriptor", OLD."id", OLD."note_id", _pgh_attach_context(), NOW(), \'mood.remove\', OLD."id", OLD."updated_at"); RETURN NULL;',
                    hash="444b324a517f0c7683728da7516d1dee65d13faf",
                    operation="DELETE",
                    pgid="pgtrigger_mood_remove_delete_0c941",
                    table="notes_mood",
                    when="AFTER",
                ),
            ),
        ),
        pgtrigger.migrations.AddTrigger(
            model_name="note",
            trigger=pgtrigger.compiler.Trigger(
                name="insert_insert",
                sql=pgtrigger.compiler.UpsertTriggerSql(
                    func='INSERT INTO "notes_noteevent" ("client_id", "created_at", "created_by_id", "id", "is_submitted", "location_id", "organization_id", "pgh_context_id", "pgh_created_at", "pgh_label", "pgh_obj_id", "private_details", "public_details", "timestamp", "title", "updated_at") VALUES (NEW."client_id", NEW."created_at", NEW."created_by_id", NEW."id", NEW."is_submitted", NEW."location_id", NEW."organization_id", _pgh_attach_context(), NOW(), \'insert\', NEW."id", NEW."private_details", NEW."public_details", NEW."timestamp", NEW."title", NEW."updated_at"); RETURN NULL;',
                    hash="b6834ce3c49a5384b7512cca9bb0ee8e01324000",
                    operation="INSERT",
                    pgid="pgtrigger_insert_insert_7ed5b",
                    table="notes_note",
                    when="AFTER",
                ),
            ),
        ),
        pgtrigger.migrations.AddTrigger(
            model_name="note",
            trigger=pgtrigger.compiler.Trigger(
                name="update_update",
                sql=pgtrigger.compiler.UpsertTriggerSql(
                    condition="WHEN (OLD.* IS DISTINCT FROM NEW.*)",
                    func='INSERT INTO "notes_noteevent" ("client_id", "created_at", "created_by_id", "id", "is_submitted", "location_id", "organization_id", "pgh_context_id", "pgh_created_at", "pgh_label", "pgh_obj_id", "private_details", "public_details", "timestamp", "title", "updated_at") VALUES (NEW."client_id", NEW."created_at", NEW."created_by_id", NEW."id", NEW."is_submitted", NEW."location_id", NEW."organization_id", _pgh_attach_context(), NOW(), \'update\', NEW."id", NEW."private_details", NEW."public_details", NEW."timestamp", NEW."title", NEW."updated_at"); RETURN NULL;',
                    hash="b5122522cee54db6bbbf17531fda6675ccd39bc9",
                    operation="UPDATE",
                    pgid="pgtrigger_update_update_38f06",
                    table="notes_note",
                    when="AFTER",
                ),
            ),
        ),
        pgtrigger.migrations.AddTrigger(
            model_name="servicerequest",
            trigger=pgtrigger.compiler.Trigger(
                name="insert_insert",
                sql=pgtrigger.compiler.UpsertTriggerSql(
                    func='INSERT INTO "notes_servicerequestevent" ("client_id", "completed_on", "created_at", "created_by_id", "custom_service", "due_by", "id", "pgh_context_id", "pgh_created_at", "pgh_label", "pgh_obj_id", "service", "status", "updated_at") VALUES (NEW."client_id", NEW."completed_on", NEW."created_at", NEW."created_by_id", NEW."custom_service", NEW."due_by", NEW."id", _pgh_attach_context(), NOW(), \'insert\', NEW."id", NEW."service", NEW."status", NEW."updated_at"); RETURN NULL;',
                    hash="3808bcb7f1b9e4a0e1dbbf73d9e38310789c6c45",
                    operation="INSERT",
                    pgid="pgtrigger_insert_insert_cd1b7",
                    table="notes_servicerequest",
                    when="AFTER",
                ),
            ),
        ),
        pgtrigger.migrations.AddTrigger(
            model_name="servicerequest",
            trigger=pgtrigger.compiler.Trigger(
                name="update_update",
                sql=pgtrigger.compiler.UpsertTriggerSql(
                    condition="WHEN (OLD.* IS DISTINCT FROM NEW.*)",
                    func='INSERT INTO "notes_servicerequestevent" ("client_id", "completed_on", "created_at", "created_by_id", "custom_service", "due_by", "id", "pgh_context_id", "pgh_created_at", "pgh_label", "pgh_obj_id", "service", "status", "updated_at") VALUES (NEW."client_id", NEW."completed_on", NEW."created_at", NEW."created_by_id", NEW."custom_service", NEW."due_by", NEW."id", _pgh_attach_context(), NOW(), \'update\', NEW."id", NEW."service", NEW."status", NEW."updated_at"); RETURN NULL;',
                    hash="a292da22eb4c4c8ff98873c2753938299d67b4c5",
                    operation="UPDATE",
                    pgid="pgtrigger_update_update_f5094",
                    table="notes_servicerequest",
                    when="AFTER",
                ),
            ),
        ),
        pgtrigger.migrations.AddTrigger(
            model_name="task",
            trigger=pgtrigger.compiler.Trigger(
                name="insert_insert",
                sql=pgtrigger.compiler.UpsertTriggerSql(
                    func='INSERT INTO "notes_taskevent" ("client_id", "created_at", "created_by_id", "due_by", "id", "location_id", "pgh_context_id", "pgh_created_at", "pgh_label", "pgh_obj_id", "status", "title", "updated_at") VALUES (NEW."client_id", NEW."created_at", NEW."created_by_id", NEW."due_by", NEW."id", NEW."location_id", _pgh_attach_context(), NOW(), \'insert\', NEW."id", NEW."status", NEW."title", NEW."updated_at"); RETURN NULL;',
                    hash="8e1505708a01bc6eafa853b18b75b99d428f1532",
                    operation="INSERT",
                    pgid="pgtrigger_insert_insert_2b90e",
                    table="notes_task",
                    when="AFTER",
                ),
            ),
        ),
        pgtrigger.migrations.AddTrigger(
            model_name="task",
            trigger=pgtrigger.compiler.Trigger(
                name="update_update",
                sql=pgtrigger.compiler.UpsertTriggerSql(
                    condition="WHEN (OLD.* IS DISTINCT FROM NEW.*)",
                    func='INSERT INTO "notes_taskevent" ("client_id", "created_at", "created_by_id", "due_by", "id", "location_id", "pgh_context_id", "pgh_created_at", "pgh_label", "pgh_obj_id", "status", "title", "updated_at") VALUES (NEW."client_id", NEW."created_at", NEW."created_by_id", NEW."due_by", NEW."id", NEW."location_id", _pgh_attach_context(), NOW(), \'update\', NEW."id", NEW."status", NEW."title", NEW."updated_at"); RETURN NULL;',
                    hash="1d329e70cbd6aff275c5d1aff0bf41ea531b8e2f",
                    operation="UPDATE",
                    pgid="pgtrigger_update_update_9f74c",
                    table="notes_task",
                    when="AFTER",
                ),
            ),
        ),
        migrations.AddField(
            model_name="taskevent",
            name="client",
            field=models.ForeignKey(
                blank=True,
                db_constraint=False,
                null=True,
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name="+",
                related_query_name="+",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="taskevent",
            name="created_by",
            field=models.ForeignKey(
                db_constraint=False,
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name="+",
                related_query_name="+",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="taskevent",
            name="location",
            field=models.ForeignKey(
                blank=True,
                db_constraint=False,
                null=True,
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name="+",
                related_query_name="+",
                to="common.location",
            ),
        ),
        migrations.AddField(
            model_name="taskevent",
            name="pgh_context",
            field=models.ForeignKey(
                db_constraint=False,
                null=True,
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name="+",
                to="pghistory.context",
            ),
        ),
        migrations.AddField(
            model_name="taskevent",
            name="pgh_obj",
            field=models.ForeignKey(
                db_constraint=False,
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name="events",
                to="notes.task",
            ),
        ),
        migrations.AddField(
            model_name="servicerequestevent",
            name="client",
            field=models.ForeignKey(
                blank=True,
                db_constraint=False,
                null=True,
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name="+",
                related_query_name="+",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="servicerequestevent",
            name="created_by",
            field=models.ForeignKey(
                db_constraint=False,
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name="+",
                related_query_name="+",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="servicerequestevent",
            name="pgh_context",
            field=models.ForeignKey(
                db_constraint=False,
                null=True,
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name="+",
                to="pghistory.context",
            ),
        ),
        migrations.AddField(
            model_name="servicerequestevent",
            name="pgh_obj",
            field=models.ForeignKey(
                db_constraint=False,
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name="events",
                to="notes.servicerequest",
            ),
        ),
        migrations.AddField(
            model_name="noterequestedservicesevent",
            name="note",
            field=models.ForeignKey(
                db_constraint=False,
                db_tablespace="",
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name="+",
                related_query_name="+",
                to="notes.note",
            ),
        ),
        migrations.AddField(
            model_name="noterequestedservicesevent",
            name="pgh_context",
            field=models.ForeignKey(
                db_constraint=False,
                null=True,
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name="+",
                to="pghistory.context",
            ),
        ),
        migrations.AddField(
            model_name="noterequestedservicesevent",
            name="servicerequest",
            field=models.ForeignKey(
                db_constraint=False,
                db_tablespace="",
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name="+",
                related_query_name="+",
                to="notes.servicerequest",
            ),
        ),
        migrations.AddField(
            model_name="notepurposesevent",
            name="note",
            field=models.ForeignKey(
                db_constraint=False,
                db_tablespace="",
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name="+",
                related_query_name="+",
                to="notes.note",
            ),
        ),
        migrations.AddField(
            model_name="notepurposesevent",
            name="pgh_context",
            field=models.ForeignKey(
                db_constraint=False,
                null=True,
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name="+",
                to="pghistory.context",
            ),
        ),
        migrations.AddField(
            model_name="notepurposesevent",
            name="task",
            field=models.ForeignKey(
                db_constraint=False,
                db_tablespace="",
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name="+",
                related_query_name="+",
                to="notes.task",
            ),
        ),
        migrations.AddField(
            model_name="noteprovidedservicesevent",
            name="note",
            field=models.ForeignKey(
                db_constraint=False,
                db_tablespace="",
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name="+",
                related_query_name="+",
                to="notes.note",
            ),
        ),
        migrations.AddField(
            model_name="noteprovidedservicesevent",
            name="pgh_context",
            field=models.ForeignKey(
                db_constraint=False,
                null=True,
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name="+",
                to="pghistory.context",
            ),
        ),
        migrations.AddField(
            model_name="noteprovidedservicesevent",
            name="servicerequest",
            field=models.ForeignKey(
                db_constraint=False,
                db_tablespace="",
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name="+",
                related_query_name="+",
                to="notes.servicerequest",
            ),
        ),
        migrations.AddField(
            model_name="notenextstepsevent",
            name="note",
            field=models.ForeignKey(
                db_constraint=False,
                db_tablespace="",
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name="+",
                related_query_name="+",
                to="notes.note",
            ),
        ),
        migrations.AddField(
            model_name="notenextstepsevent",
            name="pgh_context",
            field=models.ForeignKey(
                db_constraint=False,
                null=True,
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name="+",
                to="pghistory.context",
            ),
        ),
        migrations.AddField(
            model_name="notenextstepsevent",
            name="task",
            field=models.ForeignKey(
                db_constraint=False,
                db_tablespace="",
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name="+",
                related_query_name="+",
                to="notes.task",
            ),
        ),
        migrations.AddField(
            model_name="noteevent",
            name="client",
            field=models.ForeignKey(
                blank=True,
                db_constraint=False,
                null=True,
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name="+",
                related_query_name="+",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="noteevent",
            name="created_by",
            field=models.ForeignKey(
                blank=True,
                db_constraint=False,
                null=True,
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name="+",
                related_query_name="+",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="noteevent",
            name="location",
            field=models.ForeignKey(
                blank=True,
                db_constraint=False,
                null=True,
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name="+",
                related_query_name="+",
                to="common.location",
            ),
        ),
        migrations.AddField(
            model_name="noteevent",
            name="organization",
            field=models.ForeignKey(
                db_constraint=False,
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name="+",
                related_query_name="+",
                to="organizations.organization",
            ),
        ),
        migrations.AddField(
            model_name="noteevent",
            name="pgh_context",
            field=models.ForeignKey(
                db_constraint=False,
                null=True,
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name="+",
                to="pghistory.context",
            ),
        ),
        migrations.AddField(
            model_name="noteevent",
            name="pgh_obj",
            field=models.ForeignKey(
                db_constraint=False,
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name="events",
                to="notes.note",
            ),
        ),
        migrations.AddField(
            model_name="moodevent",
            name="note",
            field=models.ForeignKey(
                db_constraint=False,
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name="+",
                related_query_name="+",
                to="notes.note",
            ),
        ),
        migrations.AddField(
            model_name="moodevent",
            name="pgh_context",
            field=models.ForeignKey(
                db_constraint=False,
                null=True,
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name="+",
                to="pghistory.context",
            ),
        ),
        migrations.AddField(
            model_name="moodevent",
            name="pgh_obj",
            field=models.ForeignKey(
                db_constraint=False,
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name="events",
                to="notes.mood",
            ),
        ),
        pgtrigger.migrations.AddTrigger(
            model_name="notenextsteps",
            trigger=pgtrigger.compiler.Trigger(
                name="note_next_steps_add_insert",
                sql=pgtrigger.compiler.UpsertTriggerSql(
                    func='INSERT INTO "notes_notenextstepsevent" ("id", "note_id", "pgh_context_id", "pgh_created_at", "pgh_label", "task_id") VALUES (NEW."id", NEW."note_id", _pgh_attach_context(), NOW(), \'note_next_steps.add\', NEW."task_id"); RETURN NULL;',
                    hash="fd9d398f604fe5af53c1046b43f4c0b934c5e579",
                    operation="INSERT",
                    pgid="pgtrigger_note_next_steps_add_insert_65c34",
                    table="notes_note_next_steps",
                    when="AFTER",
                ),
            ),
        ),
        pgtrigger.migrations.AddTrigger(
            model_name="notenextsteps",
            trigger=pgtrigger.compiler.Trigger(
                name="note_next_steps_remove_delete",
                sql=pgtrigger.compiler.UpsertTriggerSql(
                    func='INSERT INTO "notes_notenextstepsevent" ("id", "note_id", "pgh_context_id", "pgh_created_at", "pgh_label", "task_id") VALUES (OLD."id", OLD."note_id", _pgh_attach_context(), NOW(), \'note_next_steps.remove\', OLD."task_id"); RETURN NULL;',
                    hash="0d60192743f8ec4d739390621be7b5e165c9ffe6",
                    operation="DELETE",
                    pgid="pgtrigger_note_next_steps_remove_delete_b9bdf",
                    table="notes_note_next_steps",
                    when="AFTER",
                ),
            ),
        ),
        pgtrigger.migrations.AddTrigger(
            model_name="noteprovidedservices",
            trigger=pgtrigger.compiler.Trigger(
                name="note_provided_services_add_insert",
                sql=pgtrigger.compiler.UpsertTriggerSql(
                    func='INSERT INTO "notes_noteprovidedservicesevent" ("id", "note_id", "pgh_context_id", "pgh_created_at", "pgh_label", "servicerequest_id") VALUES (NEW."id", NEW."note_id", _pgh_attach_context(), NOW(), \'note_provided_services.add\', NEW."servicerequest_id"); RETURN NULL;',
                    hash="609d058ed697cb14e6dd519cde60c15fd968e138",
                    operation="INSERT",
                    pgid="pgtrigger_note_provided_services_add_insert_c8860",
                    table="notes_note_provided_services",
                    when="AFTER",
                ),
            ),
        ),
        pgtrigger.migrations.AddTrigger(
            model_name="noteprovidedservices",
            trigger=pgtrigger.compiler.Trigger(
                name="note_provided_services_remove_delete",
                sql=pgtrigger.compiler.UpsertTriggerSql(
                    func='INSERT INTO "notes_noteprovidedservicesevent" ("id", "note_id", "pgh_context_id", "pgh_created_at", "pgh_label", "servicerequest_id") VALUES (OLD."id", OLD."note_id", _pgh_attach_context(), NOW(), \'note_provided_services.remove\', OLD."servicerequest_id"); RETURN NULL;',
                    hash="1c4d44d2790dac31828a1ae933628adc05747275",
                    operation="DELETE",
                    pgid="pgtrigger_note_provided_services_remove_delete_46d32",
                    table="notes_note_provided_services",
                    when="AFTER",
                ),
            ),
        ),
        pgtrigger.migrations.AddTrigger(
            model_name="notepurposes",
            trigger=pgtrigger.compiler.Trigger(
                name="note_purposes_add_insert",
                sql=pgtrigger.compiler.UpsertTriggerSql(
                    func='INSERT INTO "notes_notepurposesevent" ("id", "note_id", "pgh_context_id", "pgh_created_at", "pgh_label", "task_id") VALUES (NEW."id", NEW."note_id", _pgh_attach_context(), NOW(), \'note_purposes.add\', NEW."task_id"); RETURN NULL;',
                    hash="0728183e85f7def7904f688a49837f203eec26ac",
                    operation="INSERT",
                    pgid="pgtrigger_note_purposes_add_insert_c0f5c",
                    table="notes_note_purposes",
                    when="AFTER",
                ),
            ),
        ),
        pgtrigger.migrations.AddTrigger(
            model_name="notepurposes",
            trigger=pgtrigger.compiler.Trigger(
                name="note_purposes_remove_delete",
                sql=pgtrigger.compiler.UpsertTriggerSql(
                    func='INSERT INTO "notes_notepurposesevent" ("id", "note_id", "pgh_context_id", "pgh_created_at", "pgh_label", "task_id") VALUES (OLD."id", OLD."note_id", _pgh_attach_context(), NOW(), \'note_purposes.remove\', OLD."task_id"); RETURN NULL;',
                    hash="52a84731643fad0cd59146ef3ac210644f732eb7",
                    operation="DELETE",
                    pgid="pgtrigger_note_purposes_remove_delete_a6c75",
                    table="notes_note_purposes",
                    when="AFTER",
                ),
            ),
        ),
        pgtrigger.migrations.AddTrigger(
            model_name="noterequestedservices",
            trigger=pgtrigger.compiler.Trigger(
                name="note_requested_services_add_insert",
                sql=pgtrigger.compiler.UpsertTriggerSql(
                    func='INSERT INTO "notes_noterequestedservicesevent" ("id", "note_id", "pgh_context_id", "pgh_created_at", "pgh_label", "servicerequest_id") VALUES (NEW."id", NEW."note_id", _pgh_attach_context(), NOW(), \'note_requested_services.add\', NEW."servicerequest_id"); RETURN NULL;',
                    hash="42724de35837c902d807e71a5561dcc75f793acb",
                    operation="INSERT",
                    pgid="pgtrigger_note_requested_services_add_insert_54897",
                    table="notes_note_requested_services",
                    when="AFTER",
                ),
            ),
        ),
        pgtrigger.migrations.AddTrigger(
            model_name="noterequestedservices",
            trigger=pgtrigger.compiler.Trigger(
                name="note_requested_services_remove_delete",
                sql=pgtrigger.compiler.UpsertTriggerSql(
                    func='INSERT INTO "notes_noterequestedservicesevent" ("id", "note_id", "pgh_context_id", "pgh_created_at", "pgh_label", "servicerequest_id") VALUES (OLD."id", OLD."note_id", _pgh_attach_context(), NOW(), \'note_requested_services.remove\', OLD."servicerequest_id"); RETURN NULL;',
                    hash="2001696ad18650cee44f5a8d45d24d9d0df42bec",
                    operation="DELETE",
                    pgid="pgtrigger_note_requested_services_remove_delete_1a764",
                    table="notes_note_requested_services",
                    when="AFTER",
                ),
            ),
        ),
    ]

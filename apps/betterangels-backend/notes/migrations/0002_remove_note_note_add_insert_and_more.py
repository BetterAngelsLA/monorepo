# Generated by Django 5.0.6 on 2024-05-13 22:31

import django.db.models.deletion
import pgtrigger.compiler
import pgtrigger.migrations
from django.db import migrations, models


def move_address_and_point_to_location(apps, schema_editor) -> None:
    Note = apps.get_model("notes", "Note")
    Task = apps.get_model("notes", "Task")
    Location = apps.get_model("common", "Location")

    db_alias = schema_editor.connection.alias
    notes = Note.objects.using(db_alias).all()

    for note in notes:
        if note.address or note.point:
            location, _ = Location.objects.using(db_alias).get_or_create(address=note.address, point=note.point)
            note.location = location
            note.save()

    tasks = Task.objects.using(db_alias).all()
    for task in tasks:
        if task.address or task.point:
            location, _ = Location.objects.using(db_alias).get_or_create(address=task.address, point=task.point)
            task.location = location
            task.save()


class Migration(migrations.Migration):

    dependencies = [
        ("common", "0012_alter_locationuserobjectpermission_unique_together_and_more"),
        ("notes", "0001_squash_through_0020"),
    ]

    operations = [
        pgtrigger.migrations.RemoveTrigger(
            model_name="note",
            name="note_add_insert",
        ),
        pgtrigger.migrations.RemoveTrigger(
            model_name="note",
            name="note_update_update",
        ),
        pgtrigger.migrations.RemoveTrigger(
            model_name="note",
            name="note_remove_delete",
        ),
        pgtrigger.migrations.RemoveTrigger(
            model_name="task",
            name="task_add_insert",
        ),
        pgtrigger.migrations.RemoveTrigger(
            model_name="task",
            name="task_remove_delete",
        ),
        migrations.AddField(
            model_name="note",
            name="location",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="notes",
                to="common.location",
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
            model_name="task",
            name="location",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="tasks",
                to="common.location",
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
        pgtrigger.migrations.AddTrigger(
            model_name="note",
            trigger=pgtrigger.compiler.Trigger(
                name="note_add_insert",
                sql=pgtrigger.compiler.UpsertTriggerSql(
                    func='INSERT INTO "notes_noteevent" ("address_id", "client_id", "created_at", "created_by_id", "id", "interacted_at", "is_submitted", "location_id", "organization_id", "pgh_context_id", "pgh_created_at", "pgh_label", "pgh_obj_id", "point", "private_details", "public_details", "title", "updated_at") VALUES (NEW."address_id", NEW."client_id", NEW."created_at", NEW."created_by_id", NEW."id", NEW."interacted_at", NEW."is_submitted", NEW."location_id", NEW."organization_id", _pgh_attach_context(), NOW(), \'note.add\', NEW."id", NEW."point", NEW."private_details", NEW."public_details", NEW."title", NEW."updated_at"); RETURN NULL;',
                    hash="48d1808c500fb823de30c3b8da92698cadc938b9",
                    operation="INSERT",
                    pgid="pgtrigger_note_add_insert_e05e6",
                    table="notes_note",
                    when="AFTER",
                ),
            ),
        ),
        pgtrigger.migrations.AddTrigger(
            model_name="note",
            trigger=pgtrigger.compiler.Trigger(
                name="note_update_update",
                sql=pgtrigger.compiler.UpsertTriggerSql(
                    condition="WHEN (OLD.* IS DISTINCT FROM NEW.*)",
                    func='INSERT INTO "notes_noteevent" ("address_id", "client_id", "created_at", "created_by_id", "id", "interacted_at", "is_submitted", "location_id", "organization_id", "pgh_context_id", "pgh_created_at", "pgh_label", "pgh_obj_id", "point", "private_details", "public_details", "title", "updated_at") VALUES (NEW."address_id", NEW."client_id", NEW."created_at", NEW."created_by_id", NEW."id", NEW."interacted_at", NEW."is_submitted", NEW."location_id", NEW."organization_id", _pgh_attach_context(), NOW(), \'note.update\', NEW."id", NEW."point", NEW."private_details", NEW."public_details", NEW."title", NEW."updated_at"); RETURN NULL;',
                    hash="6dbafc98904b42eda8d532474eb758f6cb41e38b",
                    operation="UPDATE",
                    pgid="pgtrigger_note_update_update_ac81f",
                    table="notes_note",
                    when="AFTER",
                ),
            ),
        ),
        pgtrigger.migrations.AddTrigger(
            model_name="note",
            trigger=pgtrigger.compiler.Trigger(
                name="note_remove_delete",
                sql=pgtrigger.compiler.UpsertTriggerSql(
                    func='INSERT INTO "notes_noteevent" ("address_id", "client_id", "created_at", "created_by_id", "id", "interacted_at", "is_submitted", "location_id", "organization_id", "pgh_context_id", "pgh_created_at", "pgh_label", "pgh_obj_id", "point", "private_details", "public_details", "title", "updated_at") VALUES (OLD."address_id", OLD."client_id", OLD."created_at", OLD."created_by_id", OLD."id", OLD."interacted_at", OLD."is_submitted", OLD."location_id", OLD."organization_id", _pgh_attach_context(), NOW(), \'note.remove\', OLD."id", OLD."point", OLD."private_details", OLD."public_details", OLD."title", OLD."updated_at"); RETURN NULL;',
                    hash="9f56c220cf5e133f269608b074769c21d63f0690",
                    operation="DELETE",
                    pgid="pgtrigger_note_remove_delete_dd722",
                    table="notes_note",
                    when="AFTER",
                ),
            ),
        ),
        pgtrigger.migrations.AddTrigger(
            model_name="task",
            trigger=pgtrigger.compiler.Trigger(
                name="task_add_insert",
                sql=pgtrigger.compiler.UpsertTriggerSql(
                    func='INSERT INTO "notes_taskevent" ("address_id", "client_id", "created_at", "created_by_id", "due_by", "id", "location_id", "pgh_context_id", "pgh_created_at", "pgh_label", "pgh_obj_id", "point", "status", "title", "updated_at") VALUES (NEW."address_id", NEW."client_id", NEW."created_at", NEW."created_by_id", NEW."due_by", NEW."id", NEW."location_id", _pgh_attach_context(), NOW(), \'task.add\', NEW."id", NEW."point", NEW."status", NEW."title", NEW."updated_at"); RETURN NULL;',
                    hash="6a44fc95d51660ecf87f30abbab6cd5a13b7b65c",
                    operation="INSERT",
                    pgid="pgtrigger_task_add_insert_19a6c",
                    table="notes_task",
                    when="AFTER",
                ),
            ),
        ),
        pgtrigger.migrations.AddTrigger(
            model_name="task",
            trigger=pgtrigger.compiler.Trigger(
                name="task_remove_delete",
                sql=pgtrigger.compiler.UpsertTriggerSql(
                    func='INSERT INTO "notes_taskevent" ("address_id", "client_id", "created_at", "created_by_id", "due_by", "id", "location_id", "pgh_context_id", "pgh_created_at", "pgh_label", "pgh_obj_id", "point", "status", "title", "updated_at") VALUES (OLD."address_id", OLD."client_id", OLD."created_at", OLD."created_by_id", OLD."due_by", OLD."id", OLD."location_id", _pgh_attach_context(), NOW(), \'task.remove\', OLD."id", OLD."point", OLD."status", OLD."title", OLD."updated_at"); RETURN NULL;',
                    hash="e0fb9238419e78cfd36def43b4f5c257ba64abfe",
                    operation="DELETE",
                    pgid="pgtrigger_task_remove_delete_ced05",
                    table="notes_task",
                    when="AFTER",
                ),
            ),
        ),
    ]

# Generated by Django 5.1.7 on 2025-04-01 22:58

import django.db.models.deletion
import pgtrigger.compiler
import pgtrigger.migrations
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("clients", "0020_clientprofile_name_email_fields"),
        ("notes", "0014_notedataimport_noteimportrecord_and_more"),
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
            model_name="servicerequest",
            name="service_request_add_insert",
        ),
        pgtrigger.migrations.RemoveTrigger(
            model_name="servicerequest",
            name="service_request_update_update",
        ),
        pgtrigger.migrations.RemoveTrigger(
            model_name="servicerequest",
            name="service_request_remove_delete",
        ),
        pgtrigger.migrations.RemoveTrigger(
            model_name="task",
            name="task_add_insert",
        ),
        pgtrigger.migrations.RemoveTrigger(
            model_name="task",
            name="task_remove_delete",
        ),
        pgtrigger.migrations.RemoveTrigger(
            model_name="task",
            name="task_update_update",
        ),
        migrations.AddField(
            model_name="note",
            name="client_profile",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="client_profile_notes",
                to="clients.clientprofile",
            ),
        ),
        migrations.AddField(
            model_name="noteevent",
            name="client_profile",
            field=models.ForeignKey(
                blank=True,
                db_constraint=False,
                null=True,
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name="+",
                related_query_name="+",
                to="clients.clientprofile",
            ),
        ),
        migrations.AddField(
            model_name="servicerequest",
            name="client_profile",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="client_profile_service_requests",
                to="clients.clientprofile",
            ),
        ),
        migrations.AddField(
            model_name="servicerequestevent",
            name="client_profile",
            field=models.ForeignKey(
                blank=True,
                db_constraint=False,
                null=True,
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name="+",
                related_query_name="+",
                to="clients.clientprofile",
            ),
        ),
        migrations.AddField(
            model_name="task",
            name="client_profile",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="client_profile_tasks",
                to="clients.clientprofile",
            ),
        ),
        migrations.AddField(
            model_name="taskevent",
            name="client_profile",
            field=models.ForeignKey(
                blank=True,
                db_constraint=False,
                null=True,
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name="+",
                related_query_name="+",
                to="clients.clientprofile",
            ),
        ),
        pgtrigger.migrations.AddTrigger(
            model_name="note",
            trigger=pgtrigger.compiler.Trigger(
                name="note_add_insert",
                sql=pgtrigger.compiler.UpsertTriggerSql(
                    func='INSERT INTO "notes_noteevent" ("client_id", "client_profile_id", "created_at", "created_by_id", "id", "interacted_at", "is_submitted", "location_id", "organization_id", "pgh_context_id", "pgh_created_at", "pgh_label", "pgh_obj_id", "private_details", "public_details", "purpose", "team", "updated_at") VALUES (NEW."client_id", NEW."client_profile_id", NEW."created_at", NEW."created_by_id", NEW."id", NEW."interacted_at", NEW."is_submitted", NEW."location_id", NEW."organization_id", _pgh_attach_context(), NOW(), \'note.add\', NEW."id", NEW."private_details", NEW."public_details", NEW."purpose", NEW."team", NEW."updated_at"); RETURN NULL;',
                    hash="676b00451e4504397c6b9bf2f9a7ac4546034b26",
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
                    func='INSERT INTO "notes_noteevent" ("client_id", "client_profile_id", "created_at", "created_by_id", "id", "interacted_at", "is_submitted", "location_id", "organization_id", "pgh_context_id", "pgh_created_at", "pgh_label", "pgh_obj_id", "private_details", "public_details", "purpose", "team", "updated_at") VALUES (NEW."client_id", NEW."client_profile_id", NEW."created_at", NEW."created_by_id", NEW."id", NEW."interacted_at", NEW."is_submitted", NEW."location_id", NEW."organization_id", _pgh_attach_context(), NOW(), \'note.update\', NEW."id", NEW."private_details", NEW."public_details", NEW."purpose", NEW."team", NEW."updated_at"); RETURN NULL;',
                    hash="b1a220af1fbc8c98899c14d7b2464e16aa2bc547",
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
                    func='INSERT INTO "notes_noteevent" ("client_id", "client_profile_id", "created_at", "created_by_id", "id", "interacted_at", "is_submitted", "location_id", "organization_id", "pgh_context_id", "pgh_created_at", "pgh_label", "pgh_obj_id", "private_details", "public_details", "purpose", "team", "updated_at") VALUES (OLD."client_id", OLD."client_profile_id", OLD."created_at", OLD."created_by_id", OLD."id", OLD."interacted_at", OLD."is_submitted", OLD."location_id", OLD."organization_id", _pgh_attach_context(), NOW(), \'note.remove\', OLD."id", OLD."private_details", OLD."public_details", OLD."purpose", OLD."team", OLD."updated_at"); RETURN NULL;',
                    hash="8abf04f3544e4cb3cb47e28b61a654d509ea0971",
                    operation="DELETE",
                    pgid="pgtrigger_note_remove_delete_dd722",
                    table="notes_note",
                    when="AFTER",
                ),
            ),
        ),
        pgtrigger.migrations.AddTrigger(
            model_name="servicerequest",
            trigger=pgtrigger.compiler.Trigger(
                name="service_request_add_insert",
                sql=pgtrigger.compiler.UpsertTriggerSql(
                    func='INSERT INTO "notes_servicerequestevent" ("client_id", "client_profile_id", "completed_on", "created_at", "created_by_id", "due_by", "id", "pgh_context_id", "pgh_created_at", "pgh_label", "pgh_obj_id", "service", "service_other", "status", "updated_at") VALUES (NEW."client_id", NEW."client_profile_id", NEW."completed_on", NEW."created_at", NEW."created_by_id", NEW."due_by", NEW."id", _pgh_attach_context(), NOW(), \'service_request.add\', NEW."id", NEW."service", NEW."service_other", NEW."status", NEW."updated_at"); RETURN NULL;',
                    hash="16610a90f8e0bb65f4cf66e62368c77593d3b81f",
                    operation="INSERT",
                    pgid="pgtrigger_service_request_add_insert_f5d42",
                    table="notes_servicerequest",
                    when="AFTER",
                ),
            ),
        ),
        pgtrigger.migrations.AddTrigger(
            model_name="servicerequest",
            trigger=pgtrigger.compiler.Trigger(
                name="service_request_update_update",
                sql=pgtrigger.compiler.UpsertTriggerSql(
                    condition="WHEN (OLD.* IS DISTINCT FROM NEW.*)",
                    func='INSERT INTO "notes_servicerequestevent" ("client_id", "client_profile_id", "completed_on", "created_at", "created_by_id", "due_by", "id", "pgh_context_id", "pgh_created_at", "pgh_label", "pgh_obj_id", "service", "service_other", "status", "updated_at") VALUES (NEW."client_id", NEW."client_profile_id", NEW."completed_on", NEW."created_at", NEW."created_by_id", NEW."due_by", NEW."id", _pgh_attach_context(), NOW(), \'service_request.update\', NEW."id", NEW."service", NEW."service_other", NEW."status", NEW."updated_at"); RETURN NULL;',
                    hash="5ec0e25df4d168f1e58dc5e8772c677b3fb34e65",
                    operation="UPDATE",
                    pgid="pgtrigger_service_request_update_update_261d7",
                    table="notes_servicerequest",
                    when="AFTER",
                ),
            ),
        ),
        pgtrigger.migrations.AddTrigger(
            model_name="servicerequest",
            trigger=pgtrigger.compiler.Trigger(
                name="service_request_remove_delete",
                sql=pgtrigger.compiler.UpsertTriggerSql(
                    func='INSERT INTO "notes_servicerequestevent" ("client_id", "client_profile_id", "completed_on", "created_at", "created_by_id", "due_by", "id", "pgh_context_id", "pgh_created_at", "pgh_label", "pgh_obj_id", "service", "service_other", "status", "updated_at") VALUES (OLD."client_id", OLD."client_profile_id", OLD."completed_on", OLD."created_at", OLD."created_by_id", OLD."due_by", OLD."id", _pgh_attach_context(), NOW(), \'service_request.remove\', OLD."id", OLD."service", OLD."service_other", OLD."status", OLD."updated_at"); RETURN NULL;',
                    hash="f0fe81db1f5e2d02ad6b4a103a72727e68b2e852",
                    operation="DELETE",
                    pgid="pgtrigger_service_request_remove_delete_53389",
                    table="notes_servicerequest",
                    when="AFTER",
                ),
            ),
        ),
        pgtrigger.migrations.AddTrigger(
            model_name="task",
            trigger=pgtrigger.compiler.Trigger(
                name="task_add_insert",
                sql=pgtrigger.compiler.UpsertTriggerSql(
                    func='INSERT INTO "notes_taskevent" ("client_id", "client_profile_id", "created_at", "created_by_id", "due_by", "id", "location_id", "pgh_context_id", "pgh_created_at", "pgh_label", "pgh_obj_id", "status", "title", "updated_at") VALUES (NEW."client_id", NEW."client_profile_id", NEW."created_at", NEW."created_by_id", NEW."due_by", NEW."id", NEW."location_id", _pgh_attach_context(), NOW(), \'task.add\', NEW."id", NEW."status", NEW."title", NEW."updated_at"); RETURN NULL;',
                    hash="7e42e451103a56a2338dd4394d8e9ad6d4110997",
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
                name="task_update_update",
                sql=pgtrigger.compiler.UpsertTriggerSql(
                    condition="WHEN (OLD.* IS DISTINCT FROM NEW.*)",
                    func='INSERT INTO "notes_taskevent" ("client_id", "client_profile_id", "created_at", "created_by_id", "due_by", "id", "location_id", "pgh_context_id", "pgh_created_at", "pgh_label", "pgh_obj_id", "status", "title", "updated_at") VALUES (NEW."client_id", NEW."client_profile_id", NEW."created_at", NEW."created_by_id", NEW."due_by", NEW."id", NEW."location_id", _pgh_attach_context(), NOW(), \'task.update\', NEW."id", NEW."status", NEW."title", NEW."updated_at"); RETURN NULL;',
                    hash="6e8176a2eac7032dceda2bb51eeabeb8bf1b19f2",
                    operation="UPDATE",
                    pgid="pgtrigger_task_update_update_6df80",
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
                    func='INSERT INTO "notes_taskevent" ("client_id", "client_profile_id", "created_at", "created_by_id", "due_by", "id", "location_id", "pgh_context_id", "pgh_created_at", "pgh_label", "pgh_obj_id", "status", "title", "updated_at") VALUES (OLD."client_id", OLD."client_profile_id", OLD."created_at", OLD."created_by_id", OLD."due_by", OLD."id", OLD."location_id", _pgh_attach_context(), NOW(), \'task.remove\', OLD."id", OLD."status", OLD."title", OLD."updated_at"); RETURN NULL;',
                    hash="eeb9021bdc13545cd19f2f298b82a0b0071601dd",
                    operation="DELETE",
                    pgid="pgtrigger_task_remove_delete_ced05",
                    table="notes_task",
                    when="AFTER",
                ),
            ),
        ),
    ]

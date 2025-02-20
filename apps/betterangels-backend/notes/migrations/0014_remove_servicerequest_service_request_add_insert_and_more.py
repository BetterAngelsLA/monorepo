# Generated by Django 5.1.6 on 2025-02-20 16:54

import pgtrigger.compiler
import pgtrigger.migrations
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("notes", "0013_add_note_team"),
    ]

    operations = [
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
        migrations.RemoveField(
            model_name="servicerequest",
            name="custom_service",
        ),
        migrations.RemoveField(
            model_name="servicerequestevent",
            name="custom_service",
        ),
        pgtrigger.migrations.AddTrigger(
            model_name="servicerequest",
            trigger=pgtrigger.compiler.Trigger(
                name="service_request_add_insert",
                sql=pgtrigger.compiler.UpsertTriggerSql(
                    func='INSERT INTO "notes_servicerequestevent" ("client_id", "completed_on", "created_at", "created_by_id", "due_by", "id", "pgh_context_id", "pgh_created_at", "pgh_label", "pgh_obj_id", "service", "service_other", "status", "updated_at") VALUES (NEW."client_id", NEW."completed_on", NEW."created_at", NEW."created_by_id", NEW."due_by", NEW."id", _pgh_attach_context(), NOW(), \'service_request.add\', NEW."id", NEW."service", NEW."service_other", NEW."status", NEW."updated_at"); RETURN NULL;',
                    hash="2c019dd073e08f8ed591990b3827aa46c34c5414",
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
                    func='INSERT INTO "notes_servicerequestevent" ("client_id", "completed_on", "created_at", "created_by_id", "due_by", "id", "pgh_context_id", "pgh_created_at", "pgh_label", "pgh_obj_id", "service", "service_other", "status", "updated_at") VALUES (NEW."client_id", NEW."completed_on", NEW."created_at", NEW."created_by_id", NEW."due_by", NEW."id", _pgh_attach_context(), NOW(), \'service_request.update\', NEW."id", NEW."service", NEW."service_other", NEW."status", NEW."updated_at"); RETURN NULL;',
                    hash="628de6c54b13b66bb63ec280fe81f2c18e520f9f",
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
                    func='INSERT INTO "notes_servicerequestevent" ("client_id", "completed_on", "created_at", "created_by_id", "due_by", "id", "pgh_context_id", "pgh_created_at", "pgh_label", "pgh_obj_id", "service", "service_other", "status", "updated_at") VALUES (OLD."client_id", OLD."completed_on", OLD."created_at", OLD."created_by_id", OLD."due_by", OLD."id", _pgh_attach_context(), NOW(), \'service_request.remove\', OLD."id", OLD."service", OLD."service_other", OLD."status", OLD."updated_at"); RETURN NULL;',
                    hash="b2e737397370344847ae31e76eea2b273a3ea52d",
                    operation="DELETE",
                    pgid="pgtrigger_service_request_remove_delete_53389",
                    table="notes_servicerequest",
                    when="AFTER",
                ),
            ),
        ),
    ]

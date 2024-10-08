# Generated by Django 5.0.7 on 2024-08-14 01:08

import pgtrigger.compiler
import pgtrigger.migrations
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0029_clienthouseholdmember"),
    ]

    operations = [
        pgtrigger.migrations.RemoveTrigger(
            model_name="user",
            name="user_add_insert",
        ),
        pgtrigger.migrations.RemoveTrigger(
            model_name="user",
            name="user_update_update",
        ),
        pgtrigger.migrations.RemoveTrigger(
            model_name="user",
            name="user_remove_delete",
        ),
        migrations.AddField(
            model_name="user",
            name="has_accepted_privacy_policy",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="user",
            name="has_accepted_tos",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="userevent",
            name="has_accepted_privacy_policy",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="userevent",
            name="has_accepted_tos",
            field=models.BooleanField(default=False),
        ),
        pgtrigger.migrations.AddTrigger(
            model_name="user",
            trigger=pgtrigger.compiler.Trigger(
                name="user_add_insert",
                sql=pgtrigger.compiler.UpsertTriggerSql(
                    func='INSERT INTO "accounts_userevent" ("date_joined", "email", "first_name", "has_accepted_privacy_policy", "has_accepted_tos", "id", "is_active", "is_staff", "is_superuser", "last_login", "last_name", "middle_name", "password", "pgh_context_id", "pgh_created_at", "pgh_label", "pgh_obj_id", "username") VALUES (NEW."date_joined", NEW."email", NEW."first_name", NEW."has_accepted_privacy_policy", NEW."has_accepted_tos", NEW."id", NEW."is_active", NEW."is_staff", NEW."is_superuser", NEW."last_login", NEW."last_name", NEW."middle_name", NEW."password", _pgh_attach_context(), NOW(), \'user.add\', NEW."id", NEW."username"); RETURN NULL;',
                    hash="c4462d66fc43441b60ab8372f6f900d1880779d8",
                    operation="INSERT",
                    pgid="pgtrigger_user_add_insert_b8dc2",
                    table="accounts_user",
                    when="AFTER",
                ),
            ),
        ),
        pgtrigger.migrations.AddTrigger(
            model_name="user",
            trigger=pgtrigger.compiler.Trigger(
                name="user_update_update",
                sql=pgtrigger.compiler.UpsertTriggerSql(
                    condition="WHEN (OLD.* IS DISTINCT FROM NEW.*)",
                    func='INSERT INTO "accounts_userevent" ("date_joined", "email", "first_name", "has_accepted_privacy_policy", "has_accepted_tos", "id", "is_active", "is_staff", "is_superuser", "last_login", "last_name", "middle_name", "password", "pgh_context_id", "pgh_created_at", "pgh_label", "pgh_obj_id", "username") VALUES (NEW."date_joined", NEW."email", NEW."first_name", NEW."has_accepted_privacy_policy", NEW."has_accepted_tos", NEW."id", NEW."is_active", NEW."is_staff", NEW."is_superuser", NEW."last_login", NEW."last_name", NEW."middle_name", NEW."password", _pgh_attach_context(), NOW(), \'user.update\', NEW."id", NEW."username"); RETURN NULL;',
                    hash="30ff3faa821f7f336d89b5dc8d86bbb6e19138fd",
                    operation="UPDATE",
                    pgid="pgtrigger_user_update_update_3ce0f",
                    table="accounts_user",
                    when="AFTER",
                ),
            ),
        ),
        pgtrigger.migrations.AddTrigger(
            model_name="user",
            trigger=pgtrigger.compiler.Trigger(
                name="user_remove_delete",
                sql=pgtrigger.compiler.UpsertTriggerSql(
                    func='INSERT INTO "accounts_userevent" ("date_joined", "email", "first_name", "has_accepted_privacy_policy", "has_accepted_tos", "id", "is_active", "is_staff", "is_superuser", "last_login", "last_name", "middle_name", "password", "pgh_context_id", "pgh_created_at", "pgh_label", "pgh_obj_id", "username") VALUES (OLD."date_joined", OLD."email", OLD."first_name", OLD."has_accepted_privacy_policy", OLD."has_accepted_tos", OLD."id", OLD."is_active", OLD."is_staff", OLD."is_superuser", OLD."last_login", OLD."last_name", OLD."middle_name", OLD."password", _pgh_attach_context(), NOW(), \'user.remove\', OLD."id", OLD."username"); RETURN NULL;',
                    hash="88e20b7a37d56584d9779cad72bada5cdae10bb4",
                    operation="DELETE",
                    pgid="pgtrigger_user_remove_delete_b47e3",
                    table="accounts_user",
                    when="AFTER",
                ),
            ),
        ),
    ]

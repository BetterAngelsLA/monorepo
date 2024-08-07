# Generated by Django 5.0.6 on 2024-06-24 16:53

import pgtrigger.compiler
import pgtrigger.migrations
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0023_alter_clientprofile_gender"),
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
            name="middle_name",
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AddField(
            model_name="userevent",
            name="middle_name",
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AlterField(
            model_name="user",
            name="first_name",
            field=models.CharField(blank=True, db_index=True, max_length=50, null=True),
        ),
        migrations.AlterField(
            model_name="user",
            name="last_name",
            field=models.CharField(blank=True, db_index=True, max_length=50, null=True),
        ),
        migrations.AlterField(
            model_name="userevent",
            name="first_name",
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AlterField(
            model_name="userevent",
            name="last_name",
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        pgtrigger.migrations.AddTrigger(
            model_name="user",
            trigger=pgtrigger.compiler.Trigger(
                name="user_add_insert",
                sql=pgtrigger.compiler.UpsertTriggerSql(
                    func='INSERT INTO "accounts_userevent" ("date_joined", "email", "first_name", "id", "is_active", "is_staff", "is_superuser", "last_login", "last_name", "middle_name", "password", "pgh_context_id", "pgh_created_at", "pgh_label", "pgh_obj_id", "username") VALUES (NEW."date_joined", NEW."email", NEW."first_name", NEW."id", NEW."is_active", NEW."is_staff", NEW."is_superuser", NEW."last_login", NEW."last_name", NEW."middle_name", NEW."password", _pgh_attach_context(), NOW(), \'user.add\', NEW."id", NEW."username"); RETURN NULL;',
                    hash="6f77adfd9139713da2a40ab858ffdec6538d1ca0",
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
                    func='INSERT INTO "accounts_userevent" ("date_joined", "email", "first_name", "id", "is_active", "is_staff", "is_superuser", "last_login", "last_name", "middle_name", "password", "pgh_context_id", "pgh_created_at", "pgh_label", "pgh_obj_id", "username") VALUES (NEW."date_joined", NEW."email", NEW."first_name", NEW."id", NEW."is_active", NEW."is_staff", NEW."is_superuser", NEW."last_login", NEW."last_name", NEW."middle_name", NEW."password", _pgh_attach_context(), NOW(), \'user.update\', NEW."id", NEW."username"); RETURN NULL;',
                    hash="cf77581307b79994f357f8c77705dc0916867397",
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
                    func='INSERT INTO "accounts_userevent" ("date_joined", "email", "first_name", "id", "is_active", "is_staff", "is_superuser", "last_login", "last_name", "middle_name", "password", "pgh_context_id", "pgh_created_at", "pgh_label", "pgh_obj_id", "username") VALUES (OLD."date_joined", OLD."email", OLD."first_name", OLD."id", OLD."is_active", OLD."is_staff", OLD."is_superuser", OLD."last_login", OLD."last_name", OLD."middle_name", OLD."password", _pgh_attach_context(), NOW(), \'user.remove\', OLD."id", OLD."username"); RETURN NULL;',
                    hash="d2775a8bef471c96553955856c21e7f3ed027771",
                    operation="DELETE",
                    pgid="pgtrigger_user_remove_delete_b47e3",
                    table="accounts_user",
                    when="AFTER",
                ),
            ),
        ),
    ]

import django.core.validators
import pgtrigger.compiler
import pgtrigger.migrations
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("clients", "0031_remove_clientprofile_client_profile_add_insert_and_more"),
    ]

    operations = [
        pgtrigger.migrations.RemoveTrigger(
            model_name="clientprofile",
            name="client_profile_add_insert",
        ),
        pgtrigger.migrations.RemoveTrigger(
            model_name="clientprofile",
            name="client_profile_update_update",
        ),
        pgtrigger.migrations.RemoveTrigger(
            model_name="clientprofile",
            name="client_profile_remove_delete",
        ),
        migrations.AddField(
            model_name="clientprofile",
            name="ssn",
            field=models.CharField(
                blank=True,
                db_index=True,
                max_length=9,
                null=True,
                validators=[
                    django.core.validators.RegexValidator(
                        message="SSN must be exactly 9 digits",
                        regex="^\\d{9}$",
                    )
                ],
            ),
        ),
        migrations.AddField(
            model_name="clientprofileevent",
            name="ssn",
            field=models.CharField(
                blank=True,
                max_length=9,
                null=True,
                validators=[
                    django.core.validators.RegexValidator(
                        message="SSN must be exactly 9 digits",
                        regex="^\\d{9}$",
                    )
                ],
            ),
        ),
        pgtrigger.migrations.AddTrigger(
            model_name="clientprofile",
            trigger=pgtrigger.compiler.Trigger(
                name="client_profile_add_insert",
                sql=pgtrigger.compiler.UpsertTriggerSql(
                    func='INSERT INTO "clients_clientprofileevent" ("ada_accommodation", "address", "california_id", "created_at", "date_of_birth", "email", "eye_color", "first_name", "gender", "gender_other", "hair_color", "height_in_inches", "id", "important_notes", "last_name", "living_situation", "mailing_address", "marital_status", "middle_name", "nickname", "pgh_context_id", "pgh_created_at", "pgh_label", "pgh_obj_id", "phone_number", "physical_description", "place_of_birth", "preferred_communication", "preferred_language", "profile_photo", "pronouns", "pronouns_other", "race", "residence_address", "residence_geolocation", "spoken_languages", "ssn", "updated_at", "veteran_status") VALUES (NEW."ada_accommodation", NEW."address", NEW."california_id", NEW."created_at", NEW."date_of_birth", NEW."email", NEW."eye_color", NEW."first_name", NEW."gender", NEW."gender_other", NEW."hair_color", NEW."height_in_inches", NEW."id", NEW."important_notes", NEW."last_name", NEW."living_situation", NEW."mailing_address", NEW."marital_status", NEW."middle_name", NEW."nickname", _pgh_attach_context(), NOW(), \'client_profile.add\', NEW."id", NEW."phone_number", NEW."physical_description", NEW."place_of_birth", NEW."preferred_communication", NEW."preferred_language", NEW."profile_photo", NEW."pronouns", NEW."pronouns_other", NEW."race", NEW."residence_address", NEW."residence_geolocation", NEW."spoken_languages", NEW."ssn", NEW."updated_at", NEW."veteran_status"); RETURN NULL;',
                    hash="51e436315fa674b27cd91737d3de15011e2b68ea",
                    operation="INSERT",
                    pgid="pgtrigger_client_profile_add_insert_4c2ed",
                    table="clients_clientprofile",
                    when="AFTER",
                ),
            ),
        ),
        pgtrigger.migrations.AddTrigger(
            model_name="clientprofile",
            trigger=pgtrigger.compiler.Trigger(
                name="client_profile_update_update",
                sql=pgtrigger.compiler.UpsertTriggerSql(
                    condition="WHEN (OLD.* IS DISTINCT FROM NEW.*)",
                    func='INSERT INTO "clients_clientprofileevent" ("ada_accommodation", "address", "california_id", "created_at", "date_of_birth", "email", "eye_color", "first_name", "gender", "gender_other", "hair_color", "height_in_inches", "id", "important_notes", "last_name", "living_situation", "mailing_address", "marital_status", "middle_name", "nickname", "pgh_context_id", "pgh_created_at", "pgh_label", "pgh_obj_id", "phone_number", "physical_description", "place_of_birth", "preferred_communication", "preferred_language", "profile_photo", "pronouns", "pronouns_other", "race", "residence_address", "residence_geolocation", "spoken_languages", "ssn", "updated_at", "veteran_status") VALUES (NEW."ada_accommodation", NEW."address", NEW."california_id", NEW."created_at", NEW."date_of_birth", NEW."email", NEW."eye_color", NEW."first_name", NEW."gender", NEW."gender_other", NEW."hair_color", NEW."height_in_inches", NEW."id", NEW."important_notes", NEW."last_name", NEW."living_situation", NEW."mailing_address", NEW."marital_status", NEW."middle_name", NEW."nickname", _pgh_attach_context(), NOW(), \'client_profile.update\', NEW."id", NEW."phone_number", NEW."physical_description", NEW."place_of_birth", NEW."preferred_communication", NEW."preferred_language", NEW."profile_photo", NEW."pronouns", NEW."pronouns_other", NEW."race", NEW."residence_address", NEW."residence_geolocation", NEW."spoken_languages", NEW."ssn", NEW."updated_at", NEW."veteran_status"); RETURN NULL;',
                    hash="aefe28966d9c80c5ba6938fea487883ad1797ddb",
                    operation="UPDATE",
                    pgid="pgtrigger_client_profile_update_update_858fb",
                    table="clients_clientprofile",
                    when="AFTER",
                ),
            ),
        ),
        pgtrigger.migrations.AddTrigger(
            model_name="clientprofile",
            trigger=pgtrigger.compiler.Trigger(
                name="client_profile_remove_delete",
                sql=pgtrigger.compiler.UpsertTriggerSql(
                    func='INSERT INTO "clients_clientprofileevent" ("ada_accommodation", "address", "california_id", "created_at", "date_of_birth", "email", "eye_color", "first_name", "gender", "gender_other", "hair_color", "height_in_inches", "id", "important_notes", "last_name", "living_situation", "mailing_address", "marital_status", "middle_name", "nickname", "pgh_context_id", "pgh_created_at", "pgh_label", "pgh_obj_id", "phone_number", "physical_description", "place_of_birth", "preferred_communication", "preferred_language", "profile_photo", "pronouns", "pronouns_other", "race", "residence_address", "residence_geolocation", "spoken_languages", "ssn", "updated_at", "veteran_status") VALUES (OLD."ada_accommodation", OLD."address", OLD."california_id", OLD."created_at", OLD."date_of_birth", OLD."email", OLD."eye_color", OLD."first_name", OLD."gender", OLD."gender_other", OLD."hair_color", OLD."height_in_inches", OLD."id", OLD."important_notes", OLD."last_name", OLD."living_situation", OLD."mailing_address", OLD."marital_status", OLD."middle_name", OLD."nickname", _pgh_attach_context(), NOW(), \'client_profile.remove\', OLD."id", OLD."phone_number", OLD."physical_description", OLD."place_of_birth", OLD."preferred_communication", OLD."preferred_language", OLD."profile_photo", OLD."pronouns", OLD."pronouns_other", OLD."race", OLD."residence_address", OLD."residence_geolocation", OLD."spoken_languages", OLD."ssn", OLD."updated_at", OLD."veteran_status"); RETURN NULL;',
                    hash="4663c574a4f901170fce12b311d83e638f118207",
                    operation="DELETE",
                    pgid="pgtrigger_client_profile_remove_delete_ade5a",
                    table="clients_clientprofile",
                    when="AFTER",
                ),
            ),
        ),
    ]

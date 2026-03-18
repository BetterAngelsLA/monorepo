import pgtrigger.migrations
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("shelters", "0038_seed_and_migrate_services"),
    ]

    operations = [
        # 1. Remove old pghistory triggers
        pgtrigger.migrations.RemoveTrigger(
            model_name="trackedgeneralservice",
            name="shelter_general_service_add_insert",
        ),
        pgtrigger.migrations.RemoveTrigger(
            model_name="trackedgeneralservice",
            name="shelter_general_service_remove_delete",
        ),
        pgtrigger.migrations.RemoveTrigger(
            model_name="trackedhealthservice",
            name="shelter_health_service_add_insert",
        ),
        pgtrigger.migrations.RemoveTrigger(
            model_name="trackedhealthservice",
            name="shelter_health_service_remove_delete",
        ),
        pgtrigger.migrations.RemoveTrigger(
            model_name="trackedimmediateneed",
            name="shelter_immediate_need_add_insert",
        ),
        pgtrigger.migrations.RemoveTrigger(
            model_name="trackedimmediateneed",
            name="shelter_immediate_need_remove_delete",
        ),
        pgtrigger.migrations.RemoveTrigger(
            model_name="trackedtrainingservice",
            name="shelter_training_service_add_insert",
        ),
        pgtrigger.migrations.RemoveTrigger(
            model_name="trackedtrainingservice",
            name="shelter_training_service_remove_delete",
        ),
        # 2. Remove fields from old event tables
        migrations.RemoveField(model_name="trackedgeneralserviceevent", name="generalservice"),
        migrations.RemoveField(model_name="trackedgeneralserviceevent", name="pgh_context"),
        migrations.RemoveField(model_name="trackedgeneralserviceevent", name="shelter"),
        migrations.RemoveField(model_name="trackedhealthserviceevent", name="healthservice"),
        migrations.RemoveField(model_name="trackedhealthserviceevent", name="pgh_context"),
        migrations.RemoveField(model_name="trackedhealthserviceevent", name="shelter"),
        migrations.RemoveField(model_name="trackedimmediateneedevent", name="immediateneed"),
        migrations.RemoveField(model_name="trackedimmediateneedevent", name="pgh_context"),
        migrations.RemoveField(model_name="trackedimmediateneedevent", name="shelter"),
        migrations.RemoveField(model_name="trackedtrainingserviceevent", name="pgh_context"),
        migrations.RemoveField(model_name="trackedtrainingserviceevent", name="shelter"),
        migrations.RemoveField(model_name="trackedtrainingserviceevent", name="trainingservice"),
        # 3. Delete old event tables
        migrations.DeleteModel(name="TrackedGeneralServiceEvent"),
        migrations.DeleteModel(name="TrackedHealthServiceEvent"),
        migrations.DeleteModel(name="TrackedImmediateNeedEvent"),
        migrations.DeleteModel(name="TrackedTrainingServiceEvent"),
        # 4. Delete old tracked proxy models
        migrations.DeleteModel(name="TrackedGeneralService"),
        migrations.DeleteModel(name="TrackedHealthService"),
        migrations.DeleteModel(name="TrackedImmediateNeed"),
        migrations.DeleteModel(name="TrackedTrainingService"),
        # 5. Remove old M2M fields from Shelter
        migrations.RemoveField(model_name="shelter", name="general_services"),
        migrations.RemoveField(model_name="shelter", name="health_services"),
        migrations.RemoveField(model_name="shelter", name="immediate_needs"),
        migrations.RemoveField(model_name="shelter", name="meal_services"),
        migrations.RemoveField(model_name="shelter", name="training_services"),
        # 6. Delete old lookup models
        migrations.DeleteModel(name="GeneralService"),
        migrations.DeleteModel(name="HealthService"),
        migrations.DeleteModel(name="ImmediateNeed"),
        migrations.DeleteModel(name="MealService"),
        migrations.DeleteModel(name="TrainingService"),
    ]

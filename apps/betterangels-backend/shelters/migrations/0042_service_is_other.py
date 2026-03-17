from django.db import migrations, models


OFFICIAL_SERVICE_NAMES = {
    "immediate_need": {"clothing", "food", "showers"},
    "general": {
        "case_management",
        "childcare",
        "computer_access",
        "employment_services",
        "financial_literacy_assistance",
        "housing_navigation",
        "legal_assistance",
        "mail",
        "phone",
        "transportation",
        "laundry",
        "tls",
    },
    "health": {"dental", "medical", "mental_health", "substance_use_treatment"},
    "training": {"job_training", "life_skills_training", "tutoring"},
    "meal": {"breakfast", "lunch", "dinner"},
}


def mark_unseeded_services_as_other(apps, schema_editor):
    Service = apps.get_model("shelters", "Service")

    for service in Service.objects.select_related("category").all():
        official_names = OFFICIAL_SERVICE_NAMES.get(service.category.name, set())
        service.is_other = service.name not in official_names
        service.save(update_fields=["is_other"])


class Migration(migrations.Migration):

    dependencies = [
        ("shelters", "0041_update_service_group_permissions"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="service",
            options={"ordering": ["category__priority", "is_other", "priority", "display_name"]},
        ),
        migrations.AddField(
            model_name="service",
            name="is_other",
            field=models.BooleanField(db_index=True, default=False),
        ),
        migrations.RunPython(mark_unseeded_services_as_other, migrations.RunPython.noop),
    ]

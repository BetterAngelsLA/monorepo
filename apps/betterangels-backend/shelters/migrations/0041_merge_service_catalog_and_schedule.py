from django.db import migrations


class Migration(migrations.Migration):
    """Merge the service-catalog branch with the schedule-cleanup branch."""

    dependencies = [
        ("shelters", "0037_remove_shelter_shelter_add_insert_and_more"),
        ("shelters", "0040_update_service_permissions"),
    ]

    operations = []

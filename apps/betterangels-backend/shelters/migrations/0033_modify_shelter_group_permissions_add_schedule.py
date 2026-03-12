from django.db import migrations
from shelters.utils import assign_permissions_to_group_in_migration


def modify_shelter_group_permissions(apps, schema_editor):
    from shelters.permissions import SchedulePermissions

    Schedule = apps.get_model("shelters", "Schedule")

    permission_map = {
        Schedule: [SchedulePermissions],
    }

    assign_permissions_to_group_in_migration(apps, "Shelter Data Entry", permission_map)
    assign_permissions_to_group_in_migration(apps, "Shelter Administration", permission_map)


class Migration(migrations.Migration):

    dependencies = [
        ("shelters", "0032_reservation_reservationclient_reservation_clients_and_more"),
    ]

    operations = [
        migrations.RunPython(modify_shelter_group_permissions),
    ]

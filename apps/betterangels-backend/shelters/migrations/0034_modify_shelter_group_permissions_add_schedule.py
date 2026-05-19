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
        ("shelters", "0033_remove_contactinfo_shelter_contact_info_add_insert_and_more"),
    ]

    operations = [
        migrations.RunPython(modify_shelter_group_permissions),
    ]

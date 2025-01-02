from django.db import migrations
from shelters.utils import assign_permissions_to_group_in_migration


def modify_shelter_group_permissions(apps, schema_editor):
    from common.permissions.enums import AddressPermissions

    Address = apps.get_model("common", "Address")

    permission_map = {
        Address: [AddressPermissions],
    }

    assign_permissions_to_group_in_migration(apps, "Shelter Data Entry", permission_map)
    assign_permissions_to_group_in_migration(apps, "Shelter Administration", permission_map)


class Migration(migrations.Migration):

    dependencies = [
        ("shelters", "0008_alter_funder_name_alter_population_name_and_more"),
    ]

    operations = [
        migrations.RunPython(modify_shelter_group_permissions),
    ]

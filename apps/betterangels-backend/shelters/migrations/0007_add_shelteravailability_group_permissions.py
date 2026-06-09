from django.db import migrations

from shelters.utils import (
    assign_permissions_to_group_in_migration,
    remove_permissions_from_group_in_migration,
)


def add_shelter_availability_permissions(apps, schema_editor):
    from shelters.models import ShelterAvailability

    permission_map = {ShelterAvailability: [ShelterAvailability.perms]}
    assign_permissions_to_group_in_migration(apps, "Shelter Data Entry", permission_map)
    assign_permissions_to_group_in_migration(apps, "Shelter Administration", permission_map)


def remove_shelter_availability_permissions(apps, schema_editor):
    from shelters.models import ShelterAvailability

    permission_map = {ShelterAvailability: [ShelterAvailability.perms]}
    remove_permissions_from_group_in_migration(apps, "Shelter Data Entry", permission_map)
    remove_permissions_from_group_in_migration(apps, "Shelter Administration", permission_map)


class Migration(migrations.Migration):

    dependencies = [
        ("shelters", "0006_alter_shelter_description_and_more"),
    ]

    operations = [
        migrations.RunPython(
            add_shelter_availability_permissions,
            remove_shelter_availability_permissions,
        ),
    ]

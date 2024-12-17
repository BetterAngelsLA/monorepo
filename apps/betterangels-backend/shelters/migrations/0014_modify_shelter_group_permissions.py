from django.db import migrations
from shelters.models import Demographic, RoomStyle, SpecialSituationRestriction
from django.contrib.auth.models import Group


def assign_permissions_to_group(apps, group_name: str, permission_map: dict) -> None:
    Group = apps.get_model("auth", "Group")
    Permission = apps.get_model("auth", "Permission")
    ContentType = apps.get_model("contenttypes", "ContentType")

    group, _ = Group.objects.get_or_create(name=group_name)
    for model, perm_enums in permission_map.items():
        content_type = ContentType.objects.get_for_model(model)
        for perm_enum in perm_enums:
            for perm in perm_enum:
                try:
                    permission, _ = Permission.objects.get_or_create(
                        codename=perm.value.split(".")[1], content_type=content_type, name=perm.label
                    )
                    group.permissions.add(permission)
                except Permission.DoesNotExist:
                    print(f"Permission {perm.value} not found for content type {content_type}")


def modify_shelter_group_permissions(apps, schema_editor):
    """
    shelters | contact info | x4
    # shelters | demographic | x4
    shelters | exterior photo | x4
    # shelters | room style | x4
    shelters | shelter program | x4
    shelters | shelter type | x4
    # shelters | special situation restriction | x4
    shelters | training service | x4
    shelters | video | x4


    additional contacts
    exterior photos
    interior photos
    videos
    """

    from shelters.permissions import (
        DemographicPermissions,
        RoomStylePermissions,
        SpecialSituationRestrictionPermissions,
    )

    Demographic = apps.get_model("shelters", "Demographic")
    RoomStyle = apps.get_model("shelters", "RoomStyle")
    SpecialSituationRestriction = apps.get_model("shelters", "SpecialSituationRestriction")

    # Data Entry Group
    data_entry_permission_map = {
        Demographic: [DemographicPermissions],
        RoomStyle: [RoomStylePermissions],
        SpecialSituationRestriction: [SpecialSituationRestrictionPermissions],
    }

    assign_permissions_to_group(apps, "Shelter Data Entry", data_entry_permission_map)

    # Administration Group
    administration_permission_map = {
        # Address: [AddressPermissions],
    }
    assign_permissions_to_group(apps, "Shelter Administration", administration_permission_map)


class Migration(migrations.Migration):

    dependencies = [
        ("shelters", "0013_shelter_geolocation"),
    ]

    operations = [
        migrations.RunPython(modify_shelter_group_permissions),
    ]

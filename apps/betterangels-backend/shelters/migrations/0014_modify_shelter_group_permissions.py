from django.db import migrations
from shelters.models import (
    ContactInfo,
    Demographic,
    ExteriorPhoto,
    RoomStyle,
    ShelterProgram,
    SpecialSituationRestriction,
    Video,
)
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
    from shelters.permissions import (
        ContactInfoPermissions,
        DemographicPermissions,
        ExteriorPhotoPermissions,
        InteriorPhotoPermissions,
        RoomStylePermissions,
        ShelterProgramPermissions,
        SpecialSituationRestrictionPermissions,
        TrainingServicePermissions,
        VideoPermissions,
    )

    ContactInfo = apps.get_model("shelters", "ContactInfo")
    Demographic = apps.get_model("shelters", "Demographic")
    ExteriorPhoto = apps.get_model("shelters", "ExteriorPhoto")
    InteriorPhoto = apps.get_model("shelters", "InteriorPhoto")
    RoomStyle = apps.get_model("shelters", "RoomStyle")
    ShelterProgram = apps.get_model("shelters", "ShelterProgram")
    SpecialSituationRestriction = apps.get_model("shelters", "SpecialSituationRestriction")
    TrainingService = apps.get_model("shelters", "TrainingService")
    Video = apps.get_model("shelters", "Video")

    permission_map = {
        ContactInfo: [ContactInfoPermissions],
        Demographic: [DemographicPermissions],
        ExteriorPhoto: [ExteriorPhotoPermissions],
        InteriorPhoto: [InteriorPhotoPermissions],
        RoomStyle: [RoomStylePermissions],
        ShelterProgram: [ShelterProgramPermissions],
        SpecialSituationRestriction: [SpecialSituationRestrictionPermissions],
        TrainingService: [TrainingServicePermissions],
        Video: [VideoPermissions],
    }

    assign_permissions_to_group(apps, "Shelter Data Entry", permission_map)
    assign_permissions_to_group(apps, "Shelter Administration", permission_map)


class Migration(migrations.Migration):

    dependencies = [
        ("shelters", "0013_shelter_geolocation"),
    ]

    operations = [
        migrations.RunPython(modify_shelter_group_permissions),
    ]

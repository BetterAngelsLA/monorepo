from django.db import migrations
from shelters.utils import assign_permissions_to_group_in_migration


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

    assign_permissions_to_group_in_migration(apps, "Shelter Data Entry", permission_map)
    assign_permissions_to_group_in_migration(apps, "Shelter Administration", permission_map)


class Migration(migrations.Migration):

    dependencies = [
        ("shelters", "0013_shelter_geolocation"),
    ]

    operations = [
        migrations.RunPython(modify_shelter_group_permissions),
    ]

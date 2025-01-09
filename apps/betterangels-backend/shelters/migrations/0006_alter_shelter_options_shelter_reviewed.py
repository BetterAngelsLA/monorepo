from django.db import migrations, models
from shelters.utils import assign_permissions_to_group_in_migration


def create_shelter_data_entry_group(apps, schema_editor):
    from shelters.permissions import (
        AccessibilityPermissions,
        CareerServicePermissions,
        CityPermissions,
        EntryRequirementPermissions,
        FunderPermissions,
        GeneralServicePermissions,
        HealthServicePermissions,
        ImmediateNeedPermissions,
        ParkingPermissions,
        PetPermissions,
        PopulationPermissions,
        ShelterPermissions,
        ShelterFieldPermissions,
        ShelterTypePermissions,
        SleepingOptionPermissions,
        SpaPermissions,
        StoragePermissions,
    )

    Accessibility = apps.get_model("shelters", "Accessibility")
    CareerService = apps.get_model("shelters", "CareerService")
    City = apps.get_model("shelters", "City")
    EntryRequirement = apps.get_model("shelters", "EntryRequirement")
    Funder = apps.get_model("shelters", "Funder")
    GeneralService = apps.get_model("shelters", "GeneralService")
    HealthService = apps.get_model("shelters", "HealthService")
    ImmediateNeed = apps.get_model("shelters", "ImmediateNeed")
    Parking = apps.get_model("shelters", "Parking")
    Pet = apps.get_model("shelters", "Pet")
    Population = apps.get_model("shelters", "Population")
    Shelter = apps.get_model("shelters", "Shelter")
    ShelterType = apps.get_model("shelters", "ShelterType")
    SleepingOption = apps.get_model("shelters", "SleepingOption")
    Spa = apps.get_model("shelters", "SPA")
    Storage = apps.get_model("shelters", "Storage")

    # Data Entry Group
    data_entry_permission_map = {
        Accessibility: [AccessibilityPermissions],
        CareerService: [CareerServicePermissions],
        City: [CityPermissions],
        EntryRequirement: [EntryRequirementPermissions],
        Funder: [FunderPermissions],
        GeneralService: [GeneralServicePermissions],
        HealthService: [HealthServicePermissions],
        ImmediateNeed: [ImmediateNeedPermissions],
        Parking: [ParkingPermissions],
        Pet: [PetPermissions],
        Population: [PopulationPermissions],
        Shelter: [ShelterPermissions],
        ShelterType: [ShelterTypePermissions],
        SleepingOption: [SleepingOptionPermissions],
        Spa: [SpaPermissions],
        Storage: [StoragePermissions],
    }

    assign_permissions_to_group_in_migration(apps, "Shelter Data Entry", data_entry_permission_map)

    # Administration Group
    administration_permission_map = {
        Accessibility: [AccessibilityPermissions],
        CareerService: [CareerServicePermissions],
        City: [CityPermissions],
        EntryRequirement: [EntryRequirementPermissions],
        Funder: [FunderPermissions],
        GeneralService: [GeneralServicePermissions],
        HealthService: [HealthServicePermissions],
        ImmediateNeed: [ImmediateNeedPermissions],
        Parking: [ParkingPermissions],
        Pet: [PetPermissions],
        Population: [PopulationPermissions],
        Shelter: [ShelterPermissions, ShelterFieldPermissions],
        ShelterType: [ShelterTypePermissions],
        SleepingOption: [SleepingOptionPermissions],
        Spa: [SpaPermissions],
        Storage: [StoragePermissions],
    }
    assign_permissions_to_group_in_migration(apps, "Shelter Administration", administration_permission_map)


class Migration(migrations.Migration):

    dependencies = [
        ("shelters", "0005_spa_alter_generalservice_name_alter_population_name_and_more"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="shelter",
            options={"permissions": (("change_shelter_is_reviewed", "Can change shelter is reviewed"),)},
        ),
        migrations.AddField(
            model_name="shelter",
            name="is_reviewed",
            field=models.BooleanField(default=False),
        ),
        migrations.RunPython(create_shelter_data_entry_group),
    ]

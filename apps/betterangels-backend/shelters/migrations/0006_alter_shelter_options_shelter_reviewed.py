from django.db import migrations, models


def create_shelter_data_entry_group(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    Permission = apps.get_model("auth", "Permission")
    ContentType = apps.get_model("contenttypes", "ContentType")

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
    group, created = Group.objects.get_or_create(name="Shelter Data Entry")

    for model, perm_enums in data_entry_permission_map.items():
        content_type = ContentType.objects.get_for_model(model)
        for perm_enum in perm_enums:
            for perm in perm_enum:
                try:
                    permission, created = Permission.objects.get_or_create(
                        codename=perm.value.split(".")[1], content_type=content_type, name=perm.label
                    )
                    group.permissions.add(permission)
                except Permission.DoesNotExist:
                    print(f"Permission {perm.value} not found for content type {content_type}")

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
    group, created = Group.objects.get_or_create(name="Shelter Administration")

    for model, perm_enums in administration_permission_map.items():
        content_type = ContentType.objects.get_for_model(model)
        for perm_enum in perm_enums:
            for perm in perm_enum:
                try:
                    permission, created = Permission.objects.get_or_create(
                        codename=perm.value.split(".")[1], content_type=content_type, name=perm.label
                    )
                    group.permissions.add(permission)
                except Permission.DoesNotExist:
                    print(f"Permission {perm.value} not found for content type {content_type}")


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

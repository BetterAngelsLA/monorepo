from django.db import migrations
from shelters.utils import assign_permissions_to_group_in_migration


def modify_shelter_group_permissions(apps, schema_editor):
    from shelters.permissions import (
        ExitPolicyPermissions,
        MealServicePermissions,
        ReferralRequirementPermissions,
    )

    ExitPolicy = apps.get_model("shelters", "ExitPolicy")
    MealService = apps.get_model("shelters", "MealService")
    ReferralRequirement = apps.get_model("shelters", "ReferralRequirement")

    permission_map = {
        ExitPolicy: [ExitPolicyPermissions],
        MealService: [MealServicePermissions],
        ReferralRequirement: [ReferralRequirementPermissions],
    }

    assign_permissions_to_group_in_migration(apps, "Shelter Data Entry", permission_map)
    assign_permissions_to_group_in_migration(apps, "Shelter Administration", permission_map)


class Migration(migrations.Migration):

    dependencies = [
        ("shelters", "0017_alter_shelter_intake_hours_and_more"),
    ]

    operations = [
        migrations.RunPython(modify_shelter_group_permissions),
    ]

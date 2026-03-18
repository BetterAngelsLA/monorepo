from django.db import migrations

OLD_SERVICE_CODENAMES = [
    "add_generalservice",
    "change_generalservice",
    "delete_generalservice",
    "view_generalservice",
    "add_healthservice",
    "change_healthservice",
    "delete_healthservice",
    "view_healthservice",
    "add_immediateneed",
    "change_immediateneed",
    "delete_immediateneed",
    "view_immediateneed",
    "add_trainingservice",
    "change_trainingservice",
    "delete_trainingservice",
    "view_trainingservice",
    "add_mealservice",
    "change_mealservice",
    "delete_mealservice",
    "view_mealservice",
]


def update_group_permissions(apps, schema_editor):
    from shelters.permissions import ServiceCategoryPermissions, ServicePermissions
    from shelters.utils import assign_permissions_to_group_in_migration

    Group = apps.get_model("auth", "Group")
    Permission = apps.get_model("auth", "Permission")
    Service = apps.get_model("shelters", "Service")
    ServiceCategory = apps.get_model("shelters", "ServiceCategory")

    old_perms = Permission.objects.filter(codename__in=OLD_SERVICE_CODENAMES)
    for group_name in ("Shelter Data Entry", "Shelter Administration"):
        try:
            group = Group.objects.get(name=group_name)
            group.permissions.remove(*old_perms)
        except Group.DoesNotExist:
            pass

    permission_map = {
        Service: [ServicePermissions],
        ServiceCategory: [ServiceCategoryPermissions],
    }
    assign_permissions_to_group_in_migration(apps, "Shelter Data Entry", permission_map)
    assign_permissions_to_group_in_migration(apps, "Shelter Administration", permission_map)


class Migration(migrations.Migration):

    dependencies = [
        ("shelters", "0040_remove_old_service_models"),
    ]

    operations = [
        migrations.RunPython(update_group_permissions, migrations.RunPython.noop),
    ]

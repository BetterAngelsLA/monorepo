# type: ignore


def assign_permissions_to_group_in_migration(apps, group_name, permission_map):
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

# type: ignore
from common.permissions.utils import PermissionSet


def assign_permissions_to_group_in_migration(apps, group_name, permission_map):
    Group = apps.get_model("auth", "Group")
    Permission = apps.get_model("auth", "Permission")
    ContentType = apps.get_model("contenttypes", "ContentType")

    group, _ = Group.objects.get_or_create(name=group_name)
    for model, perm_sources in permission_map.items():
        content_type = ContentType.objects.get_for_model(model)
        for source in perm_sources:
            if isinstance(source, type) and issubclass(source, PermissionSet):
                # PermissionSet class — collect all permission codenames with labels
                labels = getattr(source, "_perm_labels", {})
                codenames = [
                    v.split(".")[1]
                    for k, v in vars(source).items()
                    if not k.startswith("_") and isinstance(v, str) and "." in v
                ]
            elif isinstance(source, list):
                # Explicit list of permission strings — derive codenames
                perms_attr = getattr(model, "perms", None)
                labels = getattr(perms_attr, "_perm_labels", {}) if perms_attr else {}
                codenames = [p.split(".")[1] for p in source]
            else:
                continue
            for codename in codenames:
                name = labels.get(codename, codename)
                permission, _ = Permission.objects.get_or_create(
                    codename=codename,
                    content_type=content_type,
                    defaults={"name": name},
                )
                group.permissions.add(permission)


def remove_permissions_from_group_in_migration(apps, group_name, permission_map):
    Group = apps.get_model("auth", "Group")
    Permission = apps.get_model("auth", "Permission")
    ContentType = apps.get_model("contenttypes", "ContentType")

    try:
        group = Group.objects.get(name=group_name)
    except Group.DoesNotExist:
        return

    for model, perm_sources in permission_map.items():
        content_type = ContentType.objects.get_for_model(model)
        for source in perm_sources:
            if isinstance(source, type) and issubclass(source, PermissionSet):
                codenames = [
                    v.split(".")[1]
                    for k, v in vars(source).items()
                    if not k.startswith("_") and isinstance(v, str) and "." in v
                ]
            elif isinstance(source, list):
                codenames = [p.split(".")[1] for p in source]
            else:
                continue
            for codename in codenames:
                try:
                    permission = Permission.objects.get(codename=codename, content_type=content_type)
                    group.permissions.remove(permission)
                except Permission.DoesNotExist:
                    print(f"Permission {codename} not found for content type {content_type}")

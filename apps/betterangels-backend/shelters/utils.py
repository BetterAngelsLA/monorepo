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
                labels = getattr(model.perms, "_perm_labels", {})
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

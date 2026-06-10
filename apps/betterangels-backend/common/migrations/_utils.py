"""Migration helpers for permission groups.

Utilities designed for use inside ``RunPython`` data migrations where
Django's ``post_migrate`` signal may not have created default model
permissions yet.
"""

from typing import Any

from common.permissions.utils import PermissionSet
from django.db.models import Model


def ensure_permissions(
    apps: Any,
    schema_editor: Any,
    permission_strings: list[str],
) -> list[Any]:
    """Given ``"app_label.codename"`` strings, ensure each Permission row
    exists (creating it via ``get_or_create`` if needed) and return the
    resolved Permission objects.
    """
    Permission = apps.get_model("auth", "Permission")
    ContentType = apps.get_model("contenttypes", "ContentType")
    db_alias = schema_editor.connection.alias

    resolved = []
    for perm_str in permission_strings:
        app_label, codename = perm_str.split(".", 1)
        model_name = codename.rsplit("_", 1)[-1]
        ct, _ = ContentType.objects.using(db_alias).get_or_create(
            app_label=app_label,
            model=model_name,
        )
        perm, _ = Permission.objects.using(db_alias).get_or_create(
            codename=codename,
            content_type=ct,
            defaults={"name": codename.replace("_", " ").title(), "content_type": ct},
        )
        resolved.append(perm)
    return resolved


def assign_permissions_to_group(
    apps: Any,
    group_name: str,
    permission_map: dict[type[Model], list],
) -> None:
    """Create an auth Group and assign permissions resolved from model classes.

    ``permission_map`` keys are Django model classes; values are lists of
    ``PermissionSet`` subclasses or explicit ``"app_label.codename"`` strings.
    """
    Group = apps.get_model("auth", "Group")
    Permission = apps.get_model("auth", "Permission")
    ContentType = apps.get_model("contenttypes", "ContentType")

    group, _ = Group.objects.get_or_create(name=group_name)
    for model, perm_sources in permission_map.items():
        content_type = ContentType.objects.get_for_model(model)
        for source in perm_sources:
            if isinstance(source, type) and issubclass(source, PermissionSet):
                labels = getattr(source, "_perm_labels", {})
                codenames = [
                    v.split(".")[1]
                    for k, v in vars(source).items()
                    if not k.startswith("_") and isinstance(v, str) and "." in v
                ]
            elif isinstance(source, list):
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


def remove_permissions_from_group(
    apps: Any,
    group_name: str,
    permission_map: dict[type[Model], list],
) -> None:
    """Remove permissions from an auth Group.

    Reverse of ``assign_permissions_to_group``.
    """
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

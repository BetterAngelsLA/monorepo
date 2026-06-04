from __future__ import annotations

from typing import Any, List, Protocol, Type

import strawberry
from accounts.models import PermissionGroup, User
from django.db.models import Exists, OuterRef, TextChoices


class GrantedPermissionsType(Protocol):
    """Protocol describing the type returned by make_granted_permissions()."""

    granted: list[TextChoices]

    @classmethod
    def get_annotations(cls, user: User) -> dict[str, Exists]: ...

    @classmethod
    def from_instance(cls, instance: object) -> Any: ...


def _annotation_key(perm: TextChoices) -> str:
    """Return a unique annotation key for the given permission enum value."""
    app_label, codename = perm.value.split(".", 1)
    return f"_perm_{app_label}_{codename}"


def permission_annotations(user: User, permissions: Type[TextChoices]) -> dict[str, Exists]:
    """Return DB-level Exists annotations for organization permission checks."""
    annotations: dict[str, Exists] = {}
    for perm in permissions:
        app_label, codename = perm.value.split(".", 1)
        annotations[_annotation_key(perm)] = Exists(
            PermissionGroup.objects.filter(
                organization=OuterRef("pk"),
                group__user=user,
                group__permissions__codename=codename,
                group__permissions__content_type__app_label=app_label,
            )
        )
    return annotations


def granted_permissions(instance: object, permissions: Type[TextChoices]) -> list[TextChoices]:
    """Return the list of permissions granted on the annotated instance."""
    return [perm for perm in permissions if getattr(instance, _annotation_key(perm), False)]


def make_granted_permissions(permissions_enum: Type[TextChoices]) -> type[GrantedPermissionsType]:
    """Create a strawberry type that resolves granted permissions for an enum.

    Usage:
        AccountsGrantedPermissions = make_granted_permissions(UserOrganizationPermissions)

    The generated class is a strawberry type with:
      - A ``granted`` field typed to ``List[permissions_enum]``
      - A ``get_annotations(user)`` classmethod for DB annotation dicts
      - A ``from_instance(instance)`` classmethod to resolve granted perms

    The GraphQL type name defaults to ``<EnumName>GrantedPermissions``
    (e.g. ``UserOrganizationPermissionsGrantedPermissions``).
    """
    name = f"{permissions_enum.__name__}GrantedPermissions"

    def get_annotations(klass: type, user: User) -> dict[str, Exists]:
        return permission_annotations(user, permissions_enum)

    def from_instance(klass: type, instance: object) -> Any:
        return klass(granted=granted_permissions(instance, permissions_enum))

    new_cls = type(
        name,
        (),
        {
            "__annotations__": {"granted": List[permissions_enum]},  # type: ignore[valid-type]
            "get_annotations": classmethod(get_annotations),
            "from_instance": classmethod(from_instance),
        },
    )

    return strawberry.type(new_cls)

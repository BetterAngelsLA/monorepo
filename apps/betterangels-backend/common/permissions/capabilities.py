from __future__ import annotations

from typing import ClassVar, List, Type

import strawberry
from accounts.models import PermissionGroup, User
from django.db.models import Exists, OuterRef, TextChoices


def _annotation_key(perm: TextChoices) -> str:
    """Return a unique annotation key for the given permission enum value."""
    app_label, codename = perm.value.split(".", 1)
    return f"_perm_{app_label}_{codename}"


def permission_annotations(user: User, permissions: Type[TextChoices]) -> dict:
    """Return DB-level Exists annotations for organization permission checks."""
    annotations = {}
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


def granted_permissions(instance: object, permissions: Type[TextChoices]) -> list:
    """Return the list of permissions granted on the annotated instance."""
    return [perm for perm in permissions if getattr(instance, _annotation_key(perm), False)]


def make_capabilities_type(name: str, permissions_enum):
    """Create a strawberry GraphQL type for a domain's capabilities.

    Usage:
        AccountsCapabilities = make_capabilities_type("AccountsCapabilities", UserOrganizationPermissions)
    """

    @strawberry.type(name=name)
    class _Capabilities:
        _permissions_enum: ClassVar = permissions_enum
        granted: List[type(permissions_enum)]  # noqa: UP006

        @classmethod
        def get_annotations(cls, user: User) -> dict:
            return permission_annotations(user, cls._permissions_enum)

        @classmethod
        def from_instance(cls, instance: object):
            return cls(granted=granted_permissions(instance, cls._permissions_enum))

    _Capabilities.__name__ = name
    _Capabilities.__qualname__ = name
    return _Capabilities

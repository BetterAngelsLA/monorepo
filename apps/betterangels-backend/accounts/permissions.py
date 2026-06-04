from __future__ import annotations

from typing import Any, List, Optional, Protocol, Type, Union

import strawberry
from accounts.models import PermissionGroup, User
from django.contrib.auth.models import AbstractBaseUser, AnonymousUser
from django.db import models
from django.db.models import Exists, OuterRef, TextChoices
from django.utils.translation import gettext_lazy as _
from organizations.models import Organization

UserLike = Union[AbstractBaseUser, AnonymousUser]


# ── Permission enums ──────────────────────────────────────────────────────────


@strawberry.enum
class UserOrganizationPermissions(models.TextChoices):
    ACCESS_ORG_PORTAL = "organizations.access_org_portal", _("Can access organization management portal")
    ADD_ORG_MEMBER = "organizations.add_org_member", _("Can add organization member")
    CHANGE_ORG_MEMBER_ROLE = "organizations.change_org_member_role", _("Can change organization member role")
    REMOVE_ORG_MEMBER = "organizations.remove_org_member", _("Can remove organization member")
    VIEW_ORG_MEMBERS = "organizations.view_org_members", _("Can view organization members")


# ── Organization permission check ─────────────────────────────────────────────


def get_user_permitted_org(
    user: UserLike,
    org_id: str,
    permission: TextChoices,
) -> Optional[Organization]:
    """Return an organization filtered by org_id, user membership in a
    permission group, and the given permission.

    *permission* should be a ``TextChoices`` enum member whose value is
    ``"app_label.codename"`` (e.g. ``ReportPermissions.VIEW_REPORTS``).

    Returns ``None`` when the user does not belong to the organization
    or does not hold the required permission.
    """
    app_label, codename = permission.value.split(".", 1)
    return Organization.objects.filter(
        pk=org_id,
        permission_groups__group__user=user,
        permission_groups__group__permissions__content_type__app_label=app_label,
        permission_groups__group__permissions__codename=codename,
    ).first()


# ── Granted permissions factory ────────────────────────────────────────────────


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

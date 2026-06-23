"""Operator selectors — list filters, queryset wrappers, and entity lookups.

All org-scoped functions live here.  None are imported by
``shelters/models`` or ``shelters/managers``, so this module has no
circular import with the model layer.
"""

from typing import TYPE_CHECKING

from common.permissions.utils import permissioned_queryset
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Exists, OuterRef, QuerySet
from organizations.models import Organization
from shelters.enums import StatusChoices

if TYPE_CHECKING:
    from accounts.models import User
    from django.contrib.auth.base_user import AbstractBaseUser
    from django.contrib.auth.models import AnonymousUser
    from shelters.models import Bed, Room, Shelter


# ── List filters ──────────────────────────────────────────────────────────────


def shelter_list(
    queryset: "QuerySet[Shelter]", *, user: "AbstractBaseUser | AnonymousUser | None" = None
) -> "QuerySet[Shelter]":
    """Filter to shelters approved for public display.

    If the user has ``view_private_shelter``, private shelters are included.
    """
    from shelters.models import Shelter

    queryset = queryset.filter(status=StatusChoices.APPROVED)
    if user and user.is_authenticated and hasattr(user, "has_perm") and user.has_perm(Shelter.perms.VIEW_PRIVATE):
        return queryset
    return queryset.filter(is_private=False)


def user_shelter_list(
    queryset: "QuerySet[Shelter]",
    *,
    user: "User",
) -> "QuerySet[Shelter]":
    """Filter to shelters belonging to organizations that *user* is a member of.

    Does NOT require a specific organization — used by global permission
    checks (e.g., photo mutations using ``HasPerm``).
    """
    return queryset.filter(Exists(Organization.objects.filter(pk=OuterRef("organization_id"), users=user)))


def operator_shelter_list(
    queryset: "QuerySet[Shelter]",
    *,
    user: "User",
    organization_id: str,
) -> "QuerySet[Shelter]":
    """Filter to shelters in *organization_id* that *user* belongs to."""
    user_orgs = Organization.objects.filter(pk=OuterRef("organization_id"), users=user)
    return queryset.filter(Exists(user_orgs), organization_id=organization_id)


# ── Queryset wrappers (hide organization_field) ───────────────────────────────


def shelter_queryset(
    queryset: "QuerySet[Shelter] | None" = None,
    *,
    user: "User",
    organization_id: str,
    perms: list[str] | None = None,
) -> "QuerySet[Shelter]":
    """Scope *queryset* to *organization_id* where *user* belongs to the org.

    Falls back to ``Shelter.objects.all()`` when *queryset* is omitted.
    """
    if queryset is None:
        from shelters.models import Shelter

        queryset = Shelter.objects.all()
    return permissioned_queryset(queryset, user=user, organization_id=organization_id, perms=perms)


def room_queryset(
    queryset: "QuerySet[Room] | None" = None,
    *,
    user: "User",
    organization_id: str,
    perms: list[str] | None = None,
) -> "QuerySet[Room]":
    """Scope *queryset* to *organization_id* where *user* belongs to the shelter's org.

    Falls back to ``Room.objects.all()`` when *queryset* is omitted.
    """
    if queryset is None:
        from shelters.models import Room

        queryset = Room.objects.all()
    return permissioned_queryset(
        queryset,
        user=user,
        organization_id=organization_id,
        perms=perms,
        organization_field="shelter__organization_id",
    )


def bed_queryset(
    queryset: "QuerySet[Bed] | None" = None,
    *,
    user: "User",
    organization_id: str,
    perms: list[str] | None = None,
) -> "QuerySet[Bed]":
    """Scope *queryset* to *organization_id* where *user* belongs to the shelter's org.

    Falls back to ``Bed.objects.all()`` when *queryset* is omitted.
    """
    if queryset is None:
        from shelters.models import Bed

        queryset = Bed.objects.all()
    return permissioned_queryset(
        queryset,
        user=user,
        organization_id=organization_id,
        perms=perms,
        organization_field="shelter__organization_id",
    )


# ── Entity lookups ────────────────────────────────────────────────────────────


def shelter_get(
    *,
    user: "User",
    shelter_id: int | str,
    organization_id: str,
    permission: str | None = None,
) -> "Shelter":
    """Return the shelter scoped to *organization_id* for *user*.

    When *permission* is provided, org membership AND the permission are
    checked in a single query.
    """
    from shelters.models import Shelter

    try:
        return shelter_queryset(
            Shelter.objects.all(),
            user=user,
            organization_id=organization_id,
            perms=[permission] if permission else None,
        ).get(pk=shelter_id)
    except Shelter.DoesNotExist:
        raise ObjectDoesNotExist(f"Shelter matching ID {shelter_id} could not be found.")


def room_get(
    *,
    user: "User",
    room_id: int | str,
    organization_id: str,
    permission: str | None = None,
) -> "Room":
    """Return the room scoped to *organization_id* for *user*."""
    from shelters.models import Room

    try:
        return room_queryset(
            Room.objects.select_related("shelter"),
            user=user,
            organization_id=organization_id,
            perms=[permission] if permission else None,
        ).get(pk=room_id)
    except Room.DoesNotExist:
        raise ObjectDoesNotExist(f"Room matching ID {room_id} could not be found.")


def bed_get(
    *,
    user: "User",
    bed_id: int | str,
    organization_id: str,
    permission: str | None = None,
) -> "Bed":
    """Return the bed scoped to *organization_id* for *user*."""
    from shelters.models import Bed

    try:
        return bed_queryset(
            Bed.objects.select_related("shelter"),
            user=user,
            organization_id=organization_id,
            perms=[permission] if permission else None,
        ).get(pk=bed_id)
    except Bed.DoesNotExist:
        raise ObjectDoesNotExist(f"Bed matching ID {bed_id} could not be found.")

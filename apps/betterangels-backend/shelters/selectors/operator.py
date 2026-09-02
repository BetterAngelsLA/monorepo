"""Operator selectors — list filters, queryset wrappers, and entity lookups.

All org-scoped functions live here.  None are imported by
``shelters/models`` or ``shelters/managers``, so this module has no
circular import with the model layer.
"""

from typing import TYPE_CHECKING

from common.permissions.selectors import visible
from common.utils import get_by_pk_or_not_found
from django.db.models import Exists, OuterRef, QuerySet
from organizations.models import Organization
from shelters.enums import StatusChoices

if TYPE_CHECKING:
    from accounts.models import User
    from django.contrib.auth.base_user import AbstractBaseUser
    from django.contrib.auth.models import AnonymousUser
    from shelters.models import Bed, Reservation, Room, Shelter


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
    """Filter to shelters belonging to *organization_id* that *user* is a member of."""
    user_orgs = Organization.objects.filter(pk=OuterRef("organization_id"), users=user)
    return queryset.filter(Exists(user_orgs), organization_id=organization_id)


# ── Queryset wrappers (hide organization_field) ───────────────────────────────


def _single_permission(perms: list[str] | None, default: str) -> str:
    """The one permission a shelter queryset authorizes with.

    ``visible`` takes a single permission; the legacy ``permissioned_queryset``
    accepted a list (AND).  Every shelter caller passes exactly one
    (VIEW/CHANGE/DELETE) — refuse more rather than silently check only the first.
    """
    if perms is None:
        return default
    if len(perms) != 1:
        raise ValueError("shelter querysets authorize exactly one permission; got {len(perms)}.")
    return perms[0]


def shelter_queryset(
    queryset: "QuerySet[Shelter] | None" = None,
    *,
    user: "User",
    organization_id: str | None,
    perms: list[str] | None = None,
) -> "QuerySet[Shelter]":
    """The shelters *user* may exercise *perms* (VIEW by default) on.

    Wraps :func:`common.permissions.selectors.visible` — the org filter comes
    from the user's Grants, and *organization_id* only confines finite scopes
    (header-optional reads, ADR 0001 §2.4/§2.6).  Falls back to
    ``Shelter.objects.all()`` when *queryset* is omitted.
    """
    from shelters.models import Shelter

    if queryset is None:
        queryset = Shelter.objects.all()
    perm = _single_permission(perms, Shelter.perms.VIEW)
    return visible(queryset, user, perm, in_org=organization_id)


def room_queryset(
    queryset: "QuerySet[Room] | None" = None,
    *,
    user: "User",
    organization_id: str | None,
    perms: list[str] | None = None,
) -> "QuerySet[Room]":
    """The rooms *user* may exercise *perms* (VIEW by default) on.

    Wraps :func:`common.permissions.selectors.visible` (rooms reach their org
    through ``shelter``); *organization_id* only confines finite scopes
    (ADR 0001 §2.4/§2.6).  Falls back to ``Room.objects.all()`` when *queryset*
    is omitted.
    """
    from shelters.models import Room

    if queryset is None:
        queryset = Room.objects.all()
    perm = _single_permission(perms, Room.perms.VIEW)
    return visible(queryset, user, perm, in_org=organization_id)


def bed_queryset(
    queryset: "QuerySet[Bed] | None" = None,
    *,
    user: "User",
    organization_id: str | None,
    perms: list[str] | None = None,
) -> "QuerySet[Bed]":
    """The beds *user* may exercise *perms* (VIEW by default) on.

    Wraps :func:`common.permissions.selectors.visible` (beds reach their org
    through ``shelter``); *organization_id* only confines finite scopes
    (ADR 0001 §2.4/§2.6).  Falls back to ``Bed.objects.all()`` when *queryset*
    is omitted.
    """
    from shelters.models import Bed

    if queryset is None:
        queryset = Bed.objects.all()
    perm = _single_permission(perms, Bed.perms.VIEW)
    return visible(queryset, user, perm, in_org=organization_id)


def reservation_queryset(
    queryset: "QuerySet[Reservation] | None" = None,
    *,
    user: "User",
    organization_id: str | None,
    perms: list[str] | None = None,
) -> "QuerySet[Reservation]":
    """The reservations *user* may exercise *perms* (VIEW by default) on.

    Wraps :func:`common.permissions.selectors.visible` — a reservation reaches
    its org through either ``bed`` or ``room`` (both org paths are derived from
    ``org_via``, so the filter cannot drift); *organization_id* only confines
    finite scopes (ADR 0001 §2.4/§2.6).  Falls back to
    ``Reservation.objects.all()`` when *queryset* is omitted.
    """
    from shelters.models import Reservation

    if queryset is None:
        queryset = Reservation.objects.all()
    perm = _single_permission(perms, Reservation.perms.VIEW)
    return visible(queryset, user, perm, in_org=organization_id)


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

    return get_by_pk_or_not_found(
        shelter_queryset(
            Shelter.objects.all(),
            user=user,
            organization_id=organization_id,
            perms=[permission] if permission else None,
        ),
        pk=shelter_id,
    )


def room_get(
    *,
    user: "User",
    room_id: int | str,
    organization_id: str,
    permission: str | None = None,
) -> "Room":
    """Return the room scoped to *organization_id* for *user*."""
    from shelters.models import Room

    return get_by_pk_or_not_found(
        room_queryset(
            Room.objects.select_related("shelter"),
            user=user,
            organization_id=organization_id,
            perms=[permission] if permission else None,
        ),
        pk=room_id,
    )


def bed_get(
    *,
    user: "User",
    bed_id: int | str,
    organization_id: str,
    permission: str | None = None,
) -> "Bed":
    """Return the bed scoped to *organization_id* for *user*."""
    from shelters.models import Bed

    return get_by_pk_or_not_found(
        bed_queryset(
            Bed.objects.select_related("shelter"),
            user=user,
            organization_id=organization_id,
            perms=[permission] if permission else None,
        ),
        pk=bed_id,
    )


def reservation_get(
    *,
    user: "User",
    organization_id: str,
    reservation_id: int | str,
    permission: str | None = None,
) -> "Reservation":
    """Return the reservation scoped to *organization_id* for *user*.

    Raises:
        ``ObjectDoesNotExist`` when no matching reservation exists in the
        organization or the user lacks the required permission.
    """
    from shelters.models import Reservation

    return get_by_pk_or_not_found(
        reservation_queryset(
            Reservation.objects.select_related("room__shelter", "bed__shelter", "created_by"),
            user=user,
            organization_id=organization_id,
            perms=[permission] if permission else None,
        ),
        pk=reservation_id,
    )

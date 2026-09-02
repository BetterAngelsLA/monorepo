"""Operator selectors — list filters, queryset wrappers, and entity lookups.

All org-scoped functions live here.  None are imported by
``shelters/models`` or ``shelters/managers``, so this module has no
circular import with the model layer.
"""

from typing import TYPE_CHECKING

from common.permissions.selectors import visible
from common.utils import get_by_pk_or_not_found
from django.db.models import QuerySet
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


# ── Queryset wrappers (hide organization_field) ───────────────────────────────


def _single_permission(perms: list[str]) -> str:
    """The one permission a shelter queryset authorizes with.

    ``visible`` takes a single permission; the legacy ``permissioned_queryset``
    accepted a list (AND).  Every shelter caller passes exactly one
    (VIEW/CHANGE/DELETE) — refuse more rather than silently check only the first.
    """
    if len(perms) != 1:
        raise ValueError("shelter querysets authorize exactly one permission; got {len(perms)}.")
    return perms[0]


def shelter_queryset(
    queryset: "QuerySet[Shelter] | None" = None,
    *,
    user: "User",
    organization_id: str | None,
    perms: list[str],
) -> "QuerySet[Shelter]":
    """The shelters *user* may exercise *perms* on.

    Wraps :func:`common.permissions.selectors.visible` — the org filter comes
    from the user's Grants, and *organization_id* only confines finite scopes
    (header-optional reads, ADR 0001 §2.4/§2.6).  Falls back to
    ``Shelter.objects.all()`` when *queryset* is omitted.
    """
    from shelters.models import Shelter

    if queryset is None:
        queryset = Shelter.objects.all()
    return visible(queryset, user, _single_permission(perms), in_org=organization_id)


def room_queryset(
    queryset: "QuerySet[Room] | None" = None,
    *,
    user: "User",
    organization_id: str | None,
    perms: list[str],
) -> "QuerySet[Room]":
    """The rooms *user* may exercise *perms* on.

    Wraps :func:`common.permissions.selectors.visible` (rooms reach their org
    through ``shelter``); *organization_id* only confines finite scopes
    (ADR 0001 §2.4/§2.6).  Falls back to ``Room.objects.all()`` when *queryset*
    is omitted.
    """
    from shelters.models import Room

    if queryset is None:
        queryset = Room.objects.all()
    return visible(queryset, user, _single_permission(perms), in_org=organization_id)


def bed_queryset(
    queryset: "QuerySet[Bed] | None" = None,
    *,
    user: "User",
    organization_id: str | None,
    perms: list[str],
) -> "QuerySet[Bed]":
    """The beds *user* may exercise *perms* on.

    Wraps :func:`common.permissions.selectors.visible` (beds reach their org
    through ``shelter``); *organization_id* only confines finite scopes
    (ADR 0001 §2.4/§2.6).  Falls back to ``Bed.objects.all()`` when *queryset*
    is omitted.
    """
    from shelters.models import Bed

    if queryset is None:
        queryset = Bed.objects.all()
    return visible(queryset, user, _single_permission(perms), in_org=organization_id)


def reservation_queryset(
    queryset: "QuerySet[Reservation] | None" = None,
    *,
    user: "User",
    organization_id: str | None,
    perms: list[str],
) -> "QuerySet[Reservation]":
    """The reservations *user* may exercise *perms* on.

    Wraps :func:`common.permissions.selectors.visible` — a reservation reaches
    its org through either ``bed`` or ``room`` (both org paths are derived from
    ``org_via``, so the filter cannot drift); *organization_id* only confines
    finite scopes (ADR 0001 §2.4/§2.6).  Falls back to
    ``Reservation.objects.all()`` when *queryset* is omitted.
    """
    from shelters.models import Reservation

    if queryset is None:
        queryset = Reservation.objects.all()
    return visible(queryset, user, _single_permission(perms), in_org=organization_id)


# ── Entity lookups ────────────────────────────────────────────────────────────


def shelter_get(
    *,
    user: "User",
    shelter_id: int | str,
    organization_id: str,
    permission: str,
) -> "Shelter":
    """Return the shelter scoped to *organization_id* for *user*.

    The row must sit in *organization_id* AND *user* must hold *permission*
    there (single query) — an unauthorized row is indistinguishable from a
    missing one (ADR 0001 §2.6).
    """
    from shelters.models import Shelter

    return get_by_pk_or_not_found(
        shelter_queryset(
            Shelter.objects.all(),
            user=user,
            organization_id=organization_id,
            perms=[permission],
        ),
        pk=shelter_id,
    )


def room_get(
    *,
    user: "User",
    room_id: int | str,
    organization_id: str,
    permission: str,
) -> "Room":
    """Return the room scoped to *organization_id* for *user* (see :func:`shelter_get`)."""
    from shelters.models import Room

    return get_by_pk_or_not_found(
        room_queryset(
            Room.objects.select_related("shelter"),
            user=user,
            organization_id=organization_id,
            perms=[permission],
        ),
        pk=room_id,
    )


def bed_get(
    *,
    user: "User",
    bed_id: int | str,
    organization_id: str,
    permission: str,
) -> "Bed":
    """Return the bed scoped to *organization_id* for *user* (see :func:`shelter_get`)."""
    from shelters.models import Bed

    return get_by_pk_or_not_found(
        bed_queryset(
            Bed.objects.select_related("shelter"),
            user=user,
            organization_id=organization_id,
            perms=[permission],
        ),
        pk=bed_id,
    )


def reservation_get(
    *,
    user: "User",
    organization_id: str,
    reservation_id: int | str,
    permission: str,
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
            perms=[permission],
        ),
        pk=reservation_id,
    )

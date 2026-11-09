"""Note read selectors (ADR 0001 §5, RFC 0003 slice 2).

Read-only: these build queryset annotations from the caller's authority and
never raise (styleguide — "selectors answer, utils refuse").  They take a
``User``, not a GraphQL ``Info``, so they are testable without a request.
"""

from typing import TYPE_CHECKING, Any, Optional, cast

from django.db.models import BooleanField, Case, F, Value, When
from organizations.models import Organization

from accounts.models import User
from common.permissions.selectors import ALL, scopes
from notes.permissions import NotePermissions, PrivateDetailsPermissions

if TYPE_CHECKING:
    from django.db.models import QuerySet


def perm_org_ids(user: User, perm: str) -> Optional[list[int]]:
    """Org ids where *user* holds *perm*; ``None`` for the global tier (all)."""
    s = scopes(user, perm)
    if s is ALL:
        return None
    # ``scopes`` answers a frozenset of org ids from the request-cached snapshot.
    return list(s)


def can_edit_case(user: User) -> Any:
    """``Case`` annotating whether the note's org is one *user* may edit.

    Replaces the guardian prefilter (``filter_for_user``): the org-scoped arm is
    the single authority; the object arm joins when the sharing edge ships.
    """
    org_ids = perm_org_ids(user, NotePermissions.CHANGE)
    if org_ids is None:
        return Value(True)
    return Case(
        When(organization_id__in=org_ids, then=Value(True)),
        default=Value(False),
        output_field=BooleanField(),
    )


def private_details_case(user: User) -> Any:
    """``Case`` masking ``private_details`` outside the orgs *user* may read it in.

    Keyed on ``PrivateDetailsPermissions.VIEW`` — the permission that exists for
    exactly this, and the one ``main`` enforced (as a per-object grant).  Keying
    it on note CHANGE conflated "may edit a note" with "may read another
    member's private notes".
    """
    org_ids = perm_org_ids(user, PrivateDetailsPermissions.VIEW)
    if org_ids is None:
        return F("private_details")
    return Case(
        When(organization_id__in=org_ids, then=F("private_details")),
        default=Value(None),
    )


def readable_note_orgs(user: User) -> "QuerySet[Organization]":
    """Organizations where *user* may read notes — the Interactions org filter.

    The filter drives a notes screen, so it follows the note read authority
    rather than legacy group membership: a grant-only caseworker used to get an
    empty filter while the notes list showed them rows.
    """
    scope = scopes(user, NotePermissions.VIEW)
    if scope is ALL:
        return cast("QuerySet[Organization]", Organization.objects.all())
    return cast("QuerySet[Organization]", Organization.objects.filter(pk__in=scope))

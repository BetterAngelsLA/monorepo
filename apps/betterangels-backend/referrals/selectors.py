from django.db.models import QuerySet

from accounts.models import User
from common.permissions.selectors import visible
from common.utils import get_or_none
from referrals.models import Referral


def referral_list(*, user: User, organization_id: int | None = None) -> QuerySet[Referral]:
    """Referrals *user* may see, optionally narrowed to one org.

    Authority is ``view_referral`` at the row's organization (ADR 0001 §2.6) —
    org membership alone is not.  *organization_id* can only narrow a finite
    scope, never widen it; the API list supplies no org, so callers see every
    org their grants reach.
    """
    return visible(
        Referral.objects.all(),
        user,
        Referral.perms.VIEW,
        in_org=organization_id,
    )


def referral_get(*, user: User, pk: str | int, perm: str = Referral.perms.VIEW) -> Referral | None:
    """A single referral *user* may exercise *perm* on, or ``None``.

    Every by-id access — read, update, delete — goes through here so the grant
    filter is applied in one place.  Load-by-id is authority-only (ADR 0001
    §2.6): the caller's current org context must not hide a row their grant
    reaches.  ``get_or_none`` makes a non-numeric id a miss, not a ``ValueError``.
    """
    return get_or_none(
        visible(Referral.objects.all(), user, perm).select_related(
            "client_profile",
            "shelter",
            "created_by",
        ),
        pk,
    )

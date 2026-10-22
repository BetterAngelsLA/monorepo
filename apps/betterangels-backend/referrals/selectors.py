from django.db.models import QuerySet

from accounts.models import User
from common.permissions.selectors import visible
from common.utils import get_or_none
from referrals.models import Referral


def referral_list(*, user: User, organization_id: int | None = None) -> QuerySet[Referral]:
    """Referrals *user* may see, optionally narrowed to the active org.

    Authority is ``view_referral`` at the row's organization (ADR 0001 §2.6) —
    org membership alone is not.  *organization_id* is the header hint: it can
    only narrow a finite scope, never widen it.
    """
    return visible(
        Referral.objects.all(),
        user,
        Referral.perms.VIEW,
        in_org=str(organization_id) if organization_id is not None else None,
    )


def referral_get(*, user: User, pk: str | int) -> Referral | None:
    """A single referral *user* may see, or ``None``.

    Load-by-id is authority-only (ADR 0001 §2.6): a stale header must not hide a
    row the caller's grant reaches.  ``get_or_none`` makes a non-numeric id a
    miss, not a ``ValueError``.
    """
    return get_or_none(
        visible(Referral.objects.all(), user, Referral.perms.VIEW).select_related(
            "client_profile",
            "shelter",
            "created_by",
        ),
        pk,
    )

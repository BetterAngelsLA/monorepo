from django.db.models import QuerySet

from accounts.models import User
from common.permissions.selectors import visible
from common.utils import get_or_none
from referrals.models import Referral


def referral_list(*, user: User, organization_id: int | None = None) -> QuerySet[Referral]:
    """Referrals the *user* may see, optionally narrowed to the active org.

    Authority is the grant predicate (ADR 0001 §2.6): ``visible`` keeps the rows
    whose organization is in the user's ``scopes()`` for ``view_referral`` — the
    organizations where they hold the scoped ``Caseworker`` Grant.  Org
    membership alone is not authority: a plain member of another org reaching a
    referral there is exactly the hole this shape closes.

    *organization_id* is the ``X-Organization-ID`` view hint.  It only narrows a
    finite scope (a global holder is never confined) and never grants: an org the
    caller has no grant at yields no rows.
    """
    return visible(
        Referral.objects.all(),
        user,
        Referral.perms.VIEW,
        in_org=str(organization_id) if organization_id is not None else None,
    )


def referral_get(*, user: User, pk: str | int, organization_id: int | None = None) -> Referral | None:
    """A single referral the *user* may see, or ``None`` outside their scope.

    ``get_or_none`` (not ``filter(pk=…).first()``) so a non-numeric id is a
    miss, not a ``ValueError`` escaping the resolver.  ``select_related`` keeps
    the hand-written single-object resolver at the optimizer's join count for
    the fields ``ReferralType`` exposes.
    """
    return get_or_none(
        referral_list(user=user, organization_id=organization_id).select_related(
            "client_profile",
            "shelter",
            "created_by",
        ),
        pk,
    )

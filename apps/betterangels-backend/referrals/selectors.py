from accounts.models import User
from django.db.models import QuerySet
from referrals.models import Referral


def referral_list(*, user: User, queryset: QuerySet[Referral] | None = None) -> QuerySet[Referral]:
    """Referrals *user* may read, ordered deterministically.

    The previous shape (``created_by=user``) was a legacy artefact: a caseworker
    saw only the referrals they personally wrote, so a colleague's referral to the
    same shelter was invisible.  Reach now comes from the grant model — the org
    role for the acting org, or the shelter the referral names (RFC 0003
    §sub-decision 3, ``own_org_or``) — which is the same authority the mutation
    gates use, so a row a caller may edit is a row they can find.

    Ordering is explicit and stable: ``Referral.Meta.ordering`` is
    ``-created_at`` alone, which is not unique, so a paginated list could repeat
    or skip rows across pages.
    """
    from common.permissions.selectors import visible

    qs = queryset if queryset is not None else Referral.objects.all()
    return visible(qs, user, Referral.perms.VIEW).order_by("-created_at", "-id")

from django.db.models import QuerySet
from organizations.models import OrganizationUser

from accounts.models import User
from referrals.models import Referral


def user_organization_ids(user: User) -> list[int]:
    """Organizations the user is a member of.

    This is the outer bound on referral access: the capability is granted per
    organization, so a caseworker must never reach another org's referrals even
    though the permission itself is model-level.
    """
    return list(OrganizationUser.objects.filter(user=user).values_list("organization_id", flat=True))


def referral_list(*, user: User, organization_id: int | None = None) -> QuerySet[Referral]:
    """Referrals the *user* may see, optionally narrowed to the active org."""
    qs = Referral.objects.filter(organization_id__in=user_organization_ids(user))
    if organization_id is not None:
        qs = qs.filter(organization_id=organization_id)
    return qs


def referral_get(*, user: User, pk: str | int, organization_id: int | None = None) -> Referral | None:
    """A single referral the *user* may see, or ``None`` outside their orgs."""
    return referral_list(user=user, organization_id=organization_id).filter(pk=pk).first()

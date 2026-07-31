from accounts.models import User
from django.db.models import QuerySet
from referrals.models import Referral


def referral_list(*, user: User) -> QuerySet[Referral]:
    """Return referrals created by the given user."""
    return Referral.objects.filter(created_by=user)

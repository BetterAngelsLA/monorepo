from typing import Any, Dict, Optional

from accounts.models import PermissionGroup, User
from clients.models import ClientProfile
from common.permissions.utils import assign_object_permissions
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from referrals.models import Referral
from referrals.permissions import ReferralPermissions
from shelters.models import Shelter


def referral_create(
    *,
    user: User,
    permission_group: PermissionGroup,
    client_profile: ClientProfile,
    shelter: Shelter,
    notes: Optional[str] = None,
) -> Referral:
    try:
        referral = Referral.objects.create(
            client_profile=client_profile,
            shelter=shelter,
            created_by=user,
            organization=permission_group.organization,
            status=Referral.Status.PENDING,
            notes=notes,
        )
    except IntegrityError as e:
        raise ValidationError(str(e)) from e

    assign_object_permissions(
        permission_group.group,
        referral,
        [ReferralPermissions.CHANGE, ReferralPermissions.DELETE],
    )
    return referral


def referral_update(*, referral: Referral, data: Dict[str, Any]) -> Referral:
    for field, value in data.items():
        if field != "id":
            setattr(referral, field, value)
    referral.save()
    return referral


def referral_delete(*, referral: Referral) -> int:
    deleted_id = referral.id
    referral.delete()
    return deleted_id

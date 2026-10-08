from typing import Any, Dict, Optional

from accounts.models import User
from clients.models import ClientProfile
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from organizations.models import Organization
from referrals.models import Referral
from shelters.models import Shelter

REFERRAL_UPDATE_FIELDS = ("status", "notes")


def referral_create(
    *,
    user: User,
    organization: Organization,
    client_profile: ClientProfile,
    shelter: Shelter,
    notes: Optional[str] = None,
) -> Referral:
    """Create a referral at *organization* (RFC 0003 §sub-decision 3).

    The org comes from the payload and is the row's ``organization``, so authority
    is the caller's org role — no per-row guardian grants are written.  A foreign
    referral (one reaching an org only through its shelter) is *readable* through
    the shared arm but not writable, which ``can_obj`` enforces by anchoring on
    the row's own org.
    """
    referral = Referral(
        client_profile=client_profile,
        shelter=shelter,
        created_by=user,
        organization=organization,
        status=Referral.Status.PENDING,
        notes=notes,
    )
    referral.full_clean()

    try:
        referral.save()
    except IntegrityError as e:
        raise ValidationError(str(e)) from e

    return referral


def referral_update(*, referral: Referral, data: Dict[str, Any]) -> Referral:
    for field, value in data.items():
        if field in REFERRAL_UPDATE_FIELDS and value is not None:
            setattr(referral, field, value)
    referral.full_clean()
    referral.save()
    return referral


def referral_delete(*, referral: Referral) -> int:
    deleted_id = referral.id
    referral.delete()
    return deleted_id

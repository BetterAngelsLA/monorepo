import logging
from typing import Any, Dict, Optional

from django.core.exceptions import ValidationError
from django.db import IntegrityError
from organizations.models import Organization

from accounts.models import User
from clients.models import ClientProfile
from referrals.models import Referral
from shelters.models import Shelter

logger = logging.getLogger(__name__)

REFERRAL_UPDATE_FIELDS = ("status", "notes")


def referral_create(
    *,
    user: User,
    organization: Organization,
    client_profile: ClientProfile,
    shelter: Shelter,
    notes: Optional[str] = None,
) -> Referral:
    """Create a referral in *organization*.

    Authority is checked by the resolver; no guardian rows are written (ADR 0001
    §2.1 rule 4).
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
        # Log the real database error for diagnosis; the client only ever sees a
        # generic message (never raw database text). Do not log the notes payload.
        logger.exception(
            "Failed to create referral (client_profile_id=%s, shelter_id=%s)",
            client_profile.pk,
            shelter.pk,
        )
        raise ValidationError("Unable to create this referral. Please check the details and try again.") from e

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

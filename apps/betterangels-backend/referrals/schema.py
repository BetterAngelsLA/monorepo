from typing import cast

import strawberry
import strawberry_django
from django.core.exceptions import PermissionDenied, ValidationError
from organizations.models import Organization
from strawberry import UNSET, asdict
from strawberry.types import Info
from strawberry_django.auth.utils import get_current_user
from strawberry_django.pagination import OffsetPaginated

from accounts.models import User
from clients.models import ClientProfile
from common.graphql.types import DeleteDjangoObjectInput, DeletedObjectType
from common.graphql.utils import org_or_deny
from common.permissions.utils import IsAuthenticated, require_can
from common.utils import get_or_none
from referrals.models import Referral
from referrals.selectors import referral_get, referral_list
from referrals.services import referral_create, referral_delete, referral_update
from shelters.models import Shelter

from .types import (
    CreateReferralInput,
    ReferralType,
    UpdateReferralInput,
)


def _target_organization(requested: object) -> Organization:
    """The create target: the ``organizationId`` on the payload.

    Optional in the schema but required in practice: an absent org is a field
    error (the caller may well be allowed to create, they just did not say
    where), while a blank or unknown id denies.  The org comes only from the
    payload.
    """
    if requested in (None, UNSET):
        raise ValidationError({"organization_id": "Select an organization to create this referral."})
    return org_or_deny(requested)


def _referral_or_deny(user: User, referral_id: str | int, perm: str, message: str) -> Referral:
    """Load a referral *user* may exercise *perm* on, or deny with *message*."""
    referral = referral_get(user=user, pk=referral_id, perm=perm)
    if referral is None:
        raise PermissionDenied(message)
    return referral


@strawberry.type
class Query:
    @strawberry_django.field(permission_classes=[IsAuthenticated])
    def referral(self, info: Info, pk: strawberry.ID) -> ReferralType:
        current_user = cast(User, get_current_user(info))
        referral = _referral_or_deny(current_user, pk, Referral.perms.VIEW, "Referral not found.")
        return cast(ReferralType, referral)

    @strawberry_django.offset_paginated(permission_classes=[IsAuthenticated])
    def referrals(
        self,
        info: Info,
    ) -> OffsetPaginated[ReferralType]:
        """Referrals the caller's ``view_referral`` grants reach.

        Authority-only: the list spans every org the caller's grants cover, and
        the ``ReferralFilter`` arguments narrow within that scope; they can
        never widen it.
        """
        current_user = cast(User, get_current_user(info))
        return cast(
            OffsetPaginated[ReferralType],
            referral_list(user=current_user),
        )


@strawberry.type
class Mutation:
    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def create_referral(self, info: Info, data: CreateReferralInput) -> ReferralType:
        """Create a referral in the org named on the payload (ADR 0001 §2.6).

        ``organizationId`` is optional in the schema but required in practice:
        an absent org is a field error, and ``require_can`` authorizes the
        named org.  The org comes only from the payload.
        """
        current_user = cast(User, get_current_user(info))
        organization = _target_organization(data.organization_id)
        require_can(current_user, Referral.perms.ADD, org=organization)

        client_profile = get_or_none(ClientProfile.objects.all(), data.client_profile)
        if client_profile is None:
            raise ValidationError({"client_profile": "Client profile not found."})

        shelter = get_or_none(Shelter.objects.all(), data.shelter)
        if shelter is None:
            raise ValidationError({"shelter": "Shelter not found."})

        referral = referral_create(
            user=current_user,
            organization=organization,
            client_profile=client_profile,
            shelter=shelter,
            notes=str(data.notes) if data.notes else None,
        )
        return cast(ReferralType, referral)

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def update_referral(self, info: Info, data: UpdateReferralInput) -> ReferralType:
        current_user = cast(User, get_current_user(info))
        referral = _referral_or_deny(
            current_user,
            data.id,
            Referral.perms.CHANGE,
            "You do not have permission to update this referral.",
        )
        referral = referral_update(referral=referral, data=asdict(data))
        return cast(ReferralType, referral)

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def delete_referral(self, info: Info, data: DeleteDjangoObjectInput) -> DeletedObjectType:
        current_user = cast(User, get_current_user(info))
        referral = _referral_or_deny(
            current_user,
            data.id,
            Referral.perms.DELETE,
            "You do not have permission to delete this referral.",
        )
        deleted_id = referral_delete(referral=referral)
        return DeletedObjectType(id=deleted_id)

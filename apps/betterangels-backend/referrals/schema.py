from typing import cast

import strawberry
import strawberry_django
from django.core.exceptions import PermissionDenied, ValidationError
from strawberry import asdict
from strawberry.permission import BasePermission
from strawberry.types import Info
from strawberry_django.auth.utils import get_current_user
from strawberry_django.pagination import OffsetPaginated

from accounts.models import User
from clients.models import ClientProfile
from common.graphql.types import DeleteDjangoObjectInput, DeletedObjectType
from common.graphql.utils import ORG_PERMISSION_DENIED_MESSAGE, get_object_or_permission_error, org_or_deny
from common.permissions.selectors import visible
from common.permissions.utils import IsAuthenticated, require_can
from common.services.feature_flags import flag_is_active
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

REFERRALS_FLAG = "ffReferrals"


class IsReferralsEnabled(BasePermission):
    """The feature flag is an access control, not only a UI hint.

    The capability says who *may* use referrals; ``ffReferrals`` says whether
    the rollout is on for this account.  Checking it server-side keeps a
    capability holder out of the API while their team is not in the pilot.
    """

    message = "Referrals are not enabled for this account."

    def has_permission(self, source: object, info: Info, **kwargs: object) -> bool:
        return flag_is_active(info, REFERRALS_FLAG)


def _active_organization_id(info: Info) -> int | None:
    """The organization the caller is acting in, from ``X-Organization-ID``.

    A view hint only (ADR 0001 §2.1 rule 3): it narrows a finite scope in
    :func:`referrals.selectors.referral_list` and never grants.  A malformed
    value fails closed with the house permission error rather than leaking a
    ``ValueError`` — the same contract as :func:`common.graphql.utils.org_or_deny`
    for payload organization ids.
    """
    request = getattr(info.context, "request", None)
    raw = getattr(request, "organization_id", None)
    if not raw:
        return None
    try:
        return int(raw)
    except (TypeError, ValueError) as exc:
        raise PermissionDenied(ORG_PERMISSION_DENIED_MESSAGE) from exc


@strawberry.type
class Query:
    @strawberry_django.field(permission_classes=[IsAuthenticated, IsReferralsEnabled])
    def referral(self, info: Info, pk: strawberry.ID) -> ReferralType:
        current_user = cast(User, get_current_user(info))
        # Load-by-id is authority-only (ADR 0001 §2.6): the header confines a
        # list view, it must not hide a row the caller's grant reaches.
        referral = referral_get(user=current_user, pk=pk)
        if referral is None:
            raise PermissionDenied("Referral not found.")
        return cast(ReferralType, referral)

    @strawberry_django.offset_paginated(permission_classes=[IsAuthenticated, IsReferralsEnabled])
    def referrals(
        self,
        info: Info,
    ) -> OffsetPaginated[ReferralType]:
        current_user = cast(User, get_current_user(info))
        return cast(
            OffsetPaginated[ReferralType],
            referral_list(user=current_user, organization_id=_active_organization_id(info)),
        )


@strawberry.type
class Mutation:
    @strawberry_django.mutation(permission_classes=[IsAuthenticated, IsReferralsEnabled])
    def create_referral(self, info: Info, data: CreateReferralInput) -> ReferralType:
        """Create a referral at an explicit organization (ADR 0001 §2.6).

        The org is on the wire, not in a header: ``org_or_deny`` resolves it
        (existence, failing closed) and ``require_can`` authorizes the ADD at
        that org.  This is the grant check — the caseworker Grant is scoped to
        the organization, so a capability holder at one org cannot create in
        another.
        """
        current_user = cast(User, get_current_user(info))
        organization = org_or_deny(data.organization_id)
        require_can(current_user, Referral.perms.ADD, org=organization)

        referral_data = asdict(data)
        client_profile = get_or_none(ClientProfile.objects.all(), referral_data.pop("client_profile"))
        if client_profile is None:
            raise ValidationError({"client_profile": "Client profile not found."})

        shelter = get_or_none(Shelter.objects.all(), referral_data.pop("shelter"))
        if shelter is None:
            raise ValidationError({"shelter": "Shelter not found."})

        referral = referral_create(
            user=current_user,
            organization=organization,
            client_profile=client_profile,
            shelter=shelter,
            notes=str(referral_data.get("notes")) if referral_data.get("notes") else None,
        )
        return cast(ReferralType, referral)

    @strawberry_django.mutation(permission_classes=[IsAuthenticated, IsReferralsEnabled])
    def update_referral(self, info: Info, data: UpdateReferralInput) -> ReferralType:
        current_user = cast(User, get_current_user(info))
        qs = visible(Referral.objects.all(), current_user, Referral.perms.CHANGE)
        referral = get_object_or_permission_error(
            qs,
            data.id,
            "You do not have permission to update this referral.",
        )
        referral = referral_update(referral=referral, data=asdict(data))
        return cast(ReferralType, referral)

    @strawberry_django.mutation(permission_classes=[IsAuthenticated, IsReferralsEnabled])
    def delete_referral(self, info: Info, data: DeleteDjangoObjectInput) -> DeletedObjectType:
        current_user = cast(User, get_current_user(info))
        referral = get_or_none(
            visible(Referral.objects.all(), current_user, Referral.perms.DELETE),
            data.id,
        )
        if referral is None:
            raise PermissionDenied("You do not have permission to delete this referral.")
        deleted_id = referral_delete(referral=referral)
        return DeletedObjectType(id=deleted_id)

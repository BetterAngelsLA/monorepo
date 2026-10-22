from typing import cast

import strawberry
import strawberry_django
from django.core.exceptions import PermissionDenied, ValidationError
from organizations.models import Organization
from strawberry import asdict
from strawberry.types import Info
from strawberry_django.auth.utils import get_current_user
from strawberry_django.pagination import OffsetPaginated

from accounts.models import User
from clients.models import ClientProfile
from common.graphql.types import DeleteDjangoObjectInput, DeletedObjectType
from common.graphql.utils import ORG_PERMISSION_DENIED_MESSAGE, org_or_deny
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


def _active_organization_id(info: Info) -> int | None:
    """The ``X-Organization-ID`` view hint: narrows a finite scope, never grants
    (ADR 0001 §2.1 rule 3).  A malformed value denies rather than escaping as a
    ``ValueError``.
    """
    request = getattr(info.context, "request", None)
    raw = getattr(request, "organization_id", None)
    if not raw:
        return None
    try:
        return int(raw)
    except (TypeError, ValueError) as exc:
        raise PermissionDenied(ORG_PERMISSION_DENIED_MESSAGE) from exc


def _target_organization(info: Info, requested: str | None) -> Organization:
    """The create target: the payload org, else the header hint.

    ``organizationId`` is optional for one release so app builds that predate it
    keep working.  Whichever org wins is authorized by the caller with
    ``require_can`` — neither source is authority on its own.
    """
    raw = requested or _active_organization_id(info)
    if raw is None:
        raise PermissionDenied("Select an organization to create this referral.")
    return org_or_deny(raw)


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
        current_user = cast(User, get_current_user(info))
        return cast(
            OffsetPaginated[ReferralType],
            referral_list(user=current_user, organization_id=_active_organization_id(info)),
        )


@strawberry.type
class Mutation:
    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def create_referral(self, info: Info, data: CreateReferralInput) -> ReferralType:
        """Create a referral in an explicit organization (ADR 0001 §2.6).

        ``organizationId`` wins; the header is a compatibility fallback for app
        builds that predate it.  ``require_can`` authorizes the ADD either way.
        """
        current_user = cast(User, get_current_user(info))
        organization = _target_organization(info, data.organization_id)
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

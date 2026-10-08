from typing import cast

import strawberry
import strawberry_django
from accounts.models import User
from clients.models import ClientProfile
from common.graphql.types import DeleteDjangoObjectInput, DeletedObjectType
from common.permissions.gates import IsAuthenticated, get_writable_or_deny, org_or_deny, require_can
from django.core.exceptions import ValidationError
from referrals.models import Referral
from referrals.selectors import referral_list
from referrals.services import referral_create, referral_delete, referral_update
from shelters.models import Shelter
from strawberry import asdict
from strawberry.types import Info
from strawberry_django.auth.utils import get_current_user
from strawberry_django.pagination import OffsetPaginated
from strawberry_django.permissions import HasPerm, HasRetvalPerm

from .types import (
    CreateReferralInput,
    ReferralType,
    UpdateReferralInput,
)


@strawberry.type
class Query:
    referral: ReferralType = strawberry_django.field(
        permission_classes=[IsAuthenticated],
        extensions=[HasRetvalPerm(Referral.perms.VIEW)],
    )

    @strawberry_django.offset_paginated(
        permission_classes=[IsAuthenticated],
        extensions=[HasRetvalPerm(Referral.perms.VIEW)],
    )
    def referrals(
        self,
        info: Info,
    ) -> OffsetPaginated[ReferralType]:
        current_user = cast(User, get_current_user(info))
        return cast(OffsetPaginated[ReferralType], referral_list(user=current_user))


@strawberry.type
class Mutation:
    @strawberry_django.mutation(
        permission_classes=[IsAuthenticated],
        extensions=[HasPerm(Referral.perms.ADD)],
    )
    def create_referral(self, info: Info, data: CreateReferralInput) -> ReferralType:
        current_user = cast(User, get_current_user(info))
        referral_data = asdict(data)
        organization = org_or_deny(referral_data.pop("organization_id", None))
        require_can(current_user, Referral.perms.ADD, org=organization)

        try:
            client_profile = ClientProfile.objects.get(pk=str(referral_data.pop("client_profile")))
        except ClientProfile.DoesNotExist:
            raise ValidationError({"client_profile": "Client profile not found."})

        try:
            shelter = Shelter.objects.get(pk=str(referral_data.pop("shelter")))
        except Shelter.DoesNotExist:
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
        """The fetch IS the gate: a forbidden row is simply unfetchable."""
        current_user = cast(User, get_current_user(info))
        referral = get_writable_or_deny(Referral.objects.all(), data.id, current_user, Referral.perms.CHANGE)
        referral = referral_update(referral=referral, data=asdict(data))
        return cast(ReferralType, referral)

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def delete_referral(self, info: Info, data: DeleteDjangoObjectInput) -> DeletedObjectType:
        current_user = cast(User, get_current_user(info))
        referral = get_writable_or_deny(Referral.objects.all(), data.id, current_user, Referral.perms.DELETE)
        deleted_id = referral_delete(referral=referral)
        return DeletedObjectType(id=deleted_id)

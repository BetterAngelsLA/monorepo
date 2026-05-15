from typing import cast

import strawberry
import strawberry_django
from accounts.models import User
from accounts.utils import get_user_permission_group
from clients.models import ClientProfile
from common.graphql.extensions import PermissionedQuerySet
from common.graphql.types import DeleteDjangoObjectInput, DeletedObjectType
from common.permissions.utils import IsAuthenticated
from django.core.exceptions import PermissionDenied
from django.db.models import QuerySet
from referrals.models import Referral
from referrals.permissions import ReferralPermissions
from referrals.services import referral_create, referral_delete, referral_update
from shelters.models import Shelter
from strawberry import asdict
from strawberry.types import Info
from strawberry_django.auth.utils import get_current_user
from strawberry_django.pagination import OffsetPaginated
from strawberry_django.permissions import HasPerm, HasRetvalPerm
from strawberry_django.utils.query import filter_for_user

from .types import (
    CreateReferralInput,
    ReferralType,
    UpdateReferralInput,
)


@strawberry.type
class Query:
    referral: ReferralType = strawberry_django.field(
        permission_classes=[IsAuthenticated],
        extensions=[HasRetvalPerm(ReferralPermissions.VIEW)],
    )

    @strawberry_django.offset_paginated(
        permission_classes=[IsAuthenticated],
        extensions=[HasRetvalPerm(ReferralPermissions.VIEW)],
    )
    def referrals(
        self,
        info: Info,
    ) -> OffsetPaginated[ReferralType]:
        current_user = get_current_user(info)
        return Referral.objects.filter(created_by=current_user)


@strawberry.type
class Mutation:
    @strawberry_django.mutation(
        permission_classes=[IsAuthenticated],
        extensions=[HasPerm(ReferralPermissions.ADD)],
    )
    def create_referral(self, info: Info, data: CreateReferralInput) -> ReferralType:
        current_user = cast(User, get_current_user(info))
        permission_group = get_user_permission_group(current_user)
        referral_data = asdict(data)
        client_profile = ClientProfile.objects.get(pk=str(referral_data.pop("client_profile")))
        shelter = Shelter.objects.get(pk=str(referral_data.pop("shelter")))
        referral = referral_create(
            user=current_user,
            permission_group=permission_group,
            client_profile=client_profile,
            shelter=shelter,
            notes=referral_data.get("notes"),
        )
        return cast(ReferralType, referral)

    @strawberry_django.mutation(
        permission_classes=[IsAuthenticated],
        extensions=[PermissionedQuerySet(model=Referral, perms=[ReferralPermissions.CHANGE])],
    )
    def update_referral(self, info: Info, data: UpdateReferralInput) -> ReferralType:
        qs: QuerySet[Referral] = info.context.qs
        clean = asdict(data)
        referral = qs.get(pk=data.id)
        referral = referral_update(referral=referral, data=clean)
        return cast(ReferralType, referral)

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def delete_referral(self, info: Info, data: DeleteDjangoObjectInput) -> DeletedObjectType:
        current_user = get_current_user(info)
        try:
            referral = filter_for_user(
                Referral.objects.all(),
                current_user,
                [ReferralPermissions.DELETE],
            ).get(id=data.id)
        except Referral.DoesNotExist:
            raise PermissionDenied("You do not have permission to delete this referral.")
        deleted_id = referral_delete(referral=referral)
        return DeletedObjectType(id=deleted_id)

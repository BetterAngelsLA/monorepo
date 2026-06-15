from typing import cast

import strawberry
import strawberry_django
from accounts.models import User
from accounts.selectors import resolve_permission_group
from notes.groups import CASEWORKER
from clients.models import ClientProfile
from common.graphql.extensions import PermissionedQuerySet
from common.graphql.types import DeleteDjangoObjectInput, DeletedObjectType
from common.permissions.utils import IsAuthenticated
from django.core.exceptions import PermissionDenied, ValidationError
from django.db.models import QuerySet
from referrals.models import Referral
from referrals.selectors import referral_list
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
        current_user = get_current_user(info)
        return cast(OffsetPaginated[ReferralType], referral_list(user=cast(User, current_user)))


@strawberry.type
class Mutation:
    @strawberry_django.mutation(
        permission_classes=[IsAuthenticated],
        extensions=[HasPerm(Referral.perms.ADD)],
    )
    def create_referral(self, info: Info, data: CreateReferralInput) -> ReferralType:
        current_user = cast(User, get_current_user(info))
        permission_group = resolve_permission_group(current_user, template=CASEWORKER)
        referral_data = asdict(data)

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
            permission_group=permission_group,
            client_profile=client_profile,
            shelter=shelter,
            notes=str(referral_data.get("notes")) if referral_data.get("notes") else None,
        )
        return cast(ReferralType, referral)

    @strawberry_django.mutation(
        permission_classes=[IsAuthenticated],
        extensions=[PermissionedQuerySet(model=Referral, perms=[Referral.perms.CHANGE])],
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
                [Referral.perms.DELETE],
            ).get(id=data.id)
        except Referral.DoesNotExist:
            raise PermissionDenied("You do not have permission to delete this referral.")
        deleted_id = referral_delete(referral=referral)
        return DeletedObjectType(id=deleted_id)

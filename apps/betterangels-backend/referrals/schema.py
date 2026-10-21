from typing import cast

import strawberry
import strawberry_django
from django.core.exceptions import PermissionDenied, ValidationError
from django.db.models import QuerySet
from strawberry import asdict
from strawberry.permission import BasePermission
from strawberry.types import Info
from strawberry_django.auth.utils import get_current_user
from strawberry_django.pagination import OffsetPaginated
from strawberry_django.permissions import HasPerm, HasRetvalPerm
from strawberry_django.utils.query import filter_for_user

from accounts.models import PermissionGroup, User
from accounts.selectors import resolve_permission_group
from clients.models import ClientProfile
from common.graphql.extensions import PermissionedQuerySet
from common.graphql.types import DeleteDjangoObjectInput, DeletedObjectType
from common.permissions.utils import IsAuthenticated
from common.services.feature_flags import flag_is_active
from notes.groups import CASEWORKER
from referrals.models import Referral
from referrals.selectors import referral_get, referral_list, user_organization_ids
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
    """The organization the caller is acting in, from ``X-Organization-ID``."""
    request = getattr(info.context, "request", None)
    org_id = getattr(request, "organization_id", None)
    return int(org_id) if org_id is not None else None


@strawberry.type
class Query:
    @strawberry_django.field(
        permission_classes=[IsAuthenticated, IsReferralsEnabled],
        extensions=[HasRetvalPerm(Referral.perms.VIEW)],
    )
    def referral(self, info: Info, pk: strawberry.ID) -> ReferralType:
        current_user = cast(User, get_current_user(info))
        referral = referral_get(user=current_user, pk=pk, organization_id=_active_organization_id(info))
        if referral is None:
            raise PermissionDenied("Referral not found.")
        return cast(ReferralType, referral)

    @strawberry_django.offset_paginated(
        permission_classes=[IsAuthenticated, IsReferralsEnabled],
        extensions=[HasRetvalPerm(Referral.perms.VIEW)],
    )
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
    @strawberry_django.mutation(
        permission_classes=[IsAuthenticated, IsReferralsEnabled],
        extensions=[HasPerm(Referral.perms.ADD)],
    )
    def create_referral(self, info: Info, data: CreateReferralInput) -> ReferralType:
        current_user = cast(User, get_current_user(info))
        organization_id = _active_organization_id(info)

        if organization_id is None:
            groups = PermissionGroup.objects.filter(template__name=CASEWORKER.name, user=current_user)
            if groups.count() > 1:
                raise ValidationError({"organization": "Send the X-Organization-ID header to choose the organization."})

        permission_group = resolve_permission_group(
            current_user,
            template=CASEWORKER,
            organization_id=str(organization_id) if organization_id is not None else None,
        )
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
        permission_classes=[IsAuthenticated, IsReferralsEnabled],
        extensions=[PermissionedQuerySet(model=Referral, perms=[Referral.perms.CHANGE])],
    )
    def update_referral(self, info: Info, data: UpdateReferralInput) -> ReferralType:
        current_user = cast(User, get_current_user(info))
        qs: QuerySet[Referral] = info.context.qs.filter(organization_id__in=user_organization_ids(current_user))
        clean = asdict(data)
        try:
            referral = qs.get(pk=data.id)
        except Referral.DoesNotExist:
            raise PermissionDenied("You do not have permission to update this referral.")
        referral = referral_update(referral=referral, data=clean)
        return cast(ReferralType, referral)

    @strawberry_django.mutation(permission_classes=[IsAuthenticated, IsReferralsEnabled])
    def delete_referral(self, info: Info, data: DeleteDjangoObjectInput) -> DeletedObjectType:
        current_user = cast(User, get_current_user(info))
        try:
            referral = filter_for_user(
                Referral.objects.filter(organization_id__in=user_organization_ids(current_user)),
                current_user,
                [Referral.perms.DELETE],
            ).get(id=data.id)
        except Referral.DoesNotExist:
            raise PermissionDenied("You do not have permission to delete this referral.")
        deleted_id = referral_delete(referral=referral)
        return DeletedObjectType(id=deleted_id)

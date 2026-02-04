from typing import Optional, Union, cast

import strawberry
import strawberry_django
from accounts.enums import OrgRoleEnum
from accounts.groups import GroupTemplateNames
from accounts.permissions import UserOrganizationPermissions
from common.graphql.extensions import PermissionedQuerySet
from common.graphql.types import DeletedObjectType
from common.permissions.utils import IsAuthenticated
from django.core.exceptions import PermissionDenied
from django.db import transaction
from django.db.models import Case, CharField, Exists, OuterRef, QuerySet, Value, When
from notes.permissions import NotePermissions
from organizations.models import Organization
from strawberry.types import Info
from strawberry_django import auth
from strawberry_django.auth.utils import get_current_user
from strawberry_django.mutations import resolvers
from strawberry_django.pagination import OffsetPaginated
from strawberry_django.permissions import HasPerm
from strawberry_django.utils.query import filter_for_user

from .models import PermissionGroup, User
from .services import OrganizationMemberService
from .types import (
    AuthResponse,
    CurrentUserType,
    LoginInput,
    OrganizationMemberOrdering,
    OrganizationMemberType,
    OrganizationOrder,
    OrganizationType,
    OrgInvitationInput,
    RemoveOrganizationMemberInput,
    UpdateOrganizationMemberRoleInput,
    UpdateUserInput,
    UserType,
)


def annotate_member_role(org_id: str) -> Case:
    is_superuser = Exists(
        PermissionGroup.objects.filter(
            organization_id=org_id,
            template__name=GroupTemplateNames.ORG_SUPERUSER,
            group__user=OuterRef("pk"),
        )
    )
    is_admin = Exists(
        PermissionGroup.objects.filter(
            organization_id=org_id,
            template__name=GroupTemplateNames.ORG_ADMIN,
            group__user=OuterRef("pk"),
        )
    )

    return Case(
        When(is_superuser, then=Value(OrgRoleEnum.SUPERUSER)),
        When(is_admin, then=Value(OrgRoleEnum.ADMIN)),
        default=Value(OrgRoleEnum.MEMBER),
        output_field=CharField(),
    )


@strawberry.type
class Query:
    @strawberry_django.field(permission_classes=[IsAuthenticated])
    def current_user(self, info: Info) -> CurrentUserType:
        return get_current_user(info)  # type: ignore

    @strawberry_django.offset_paginated(
        OffsetPaginated[OrganizationType],
        permission_classes=[IsAuthenticated],
        extensions=[HasPerm(NotePermissions.ADD)],
    )
    def caseworker_organizations(self, ordering: Optional[list[OrganizationOrder]] = None) -> QuerySet[Organization]:
        queryset: QuerySet[Organization] = Organization.objects.filter(
            permission_groups__name__icontains=GroupTemplateNames.CASEWORKER
        )
        return queryset

    @strawberry_django.field(
        permission_classes=[IsAuthenticated], extensions=[HasPerm(UserOrganizationPermissions.VIEW_ORG_MEMBERS)]
    )
    def organization_member(self, info: Info, organization_id: str, user_id: str) -> OrganizationMemberType:
        current_user = cast(User, get_current_user(info))
        try:
            organization = filter_for_user(
                Organization.objects.filter(users=current_user),
                current_user,
                [UserOrganizationPermissions.VIEW_ORG_MEMBERS],
            ).get(id=organization_id)
        except Organization.DoesNotExist:
            raise PermissionError("You do not have permission to view this organization's members.")

        user: User = (
            organization.users.filter(id=user_id).annotate(_member_role=annotate_member_role(organization_id)).first()
        )
        if not user:
            raise PermissionError("You do not have permission to view this member.")

        return cast(OrganizationMemberType, user)

    @strawberry_django.offset_paginated(
        OffsetPaginated[OrganizationMemberType],
        permission_classes=[IsAuthenticated],
        extensions=[HasPerm(UserOrganizationPermissions.VIEW_ORG_MEMBERS)],
    )
    def organization_members(
        self, info: Info, organization_id: str, ordering: Optional[list[OrganizationMemberOrdering]] = None
    ) -> QuerySet[User]:
        current_user = cast(User, get_current_user(info))
        try:
            organization = filter_for_user(
                Organization.objects.filter(users=current_user),
                current_user,
                [UserOrganizationPermissions.VIEW_ORG_MEMBERS],
            ).get(id=organization_id)
        except Organization.DoesNotExist:
            raise PermissionError("You do not have permission to view this organization's members.")

        queryset: QuerySet[User] = organization.users.all()

        return queryset.annotate(_member_role=annotate_member_role(organization_id))


@strawberry.type
class Mutation:
    logout = auth.logout()

    @strawberry.mutation
    def login(self, input: LoginInput) -> AuthResponse:
        # The is a stub and logic is handled client-side by Apollo
        return AuthResponse(status_code="")

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def update_current_user(self, info: Info, data: UpdateUserInput) -> Union[UserType, CurrentUserType]:
        user = cast(User, get_current_user(info))
        if str(user.pk) != str(data.id):
            raise PermissionError("You do not have permission to modify this user.")

        user_data: dict = strawberry.asdict(data)

        user = resolvers.update(
            info,
            user,
            {
                **user_data,
                "id": user.pk,
            },
        )

        return cast(UserType, user)

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def delete_current_user(self, info: Info) -> DeletedObjectType:
        user = get_current_user(info)
        if user.pk is None:
            raise RuntimeError("Cannot delete user.")

        user_id = user.pk

        with transaction.atomic():
            user.delete()

        return DeletedObjectType(id=user_id)

    @strawberry_django.mutation(
        permission_classes=[IsAuthenticated],
        extensions=[
            PermissionedQuerySet(
                UserOrganizationPermissions.ADD_ORG_MEMBER,
                model=Organization,
                check_retval=False,
            )
        ],
    )
    def add_organization_member(self, info: Info, data: OrgInvitationInput) -> OrganizationMemberType:
        current_user = cast(User, get_current_user(info))

        try:
            organization = info.context.qs.get(id=data.organization_id)
        except Organization.DoesNotExist:
            raise PermissionDenied("You do not have permission to add members.")

        user = OrganizationMemberService.add(
            organization=organization,
            email=data.email,
            first_name=data.first_name,
            last_name=data.last_name,
            middle_name=data.middle_name,
            current_user=current_user,
        )

        return cast(OrganizationMemberType, user)

    @strawberry_django.mutation(
        permission_classes=[IsAuthenticated],
        extensions=[
            PermissionedQuerySet(
                UserOrganizationPermissions.REMOVE_ORG_MEMBER,
                model=Organization,
                check_retval=False,
            )
        ],
    )
    def remove_organization_member(
        self,
        info: Info,
        data: RemoveOrganizationMemberInput,
    ) -> DeletedObjectType:
        current_user = cast(User, get_current_user(info))

        try:
            organization = info.context.qs.get(id=data.organization_id)
        except Organization.DoesNotExist:
            raise PermissionDenied("You do not have permission to remove members.")

        user_id = OrganizationMemberService.remove(
            organization=organization,
            user_id=int(data.id),
            current_user=current_user,
        )
        return DeletedObjectType(id=user_id)

    @strawberry_django.mutation(
        permission_classes=[IsAuthenticated],
        extensions=[
            PermissionedQuerySet(
                UserOrganizationPermissions.CHANGE_ORG_MEMBER_ROLE,
                model=Organization,
                check_retval=False,
            )
        ],
    )
    def update_organization_member_role(
        self,
        info: Info,
        data: UpdateOrganizationMemberRoleInput,
    ) -> OrganizationMemberType:
        current_user = cast(User, get_current_user(info))

        try:
            organization = info.context.qs.get(id=data.organization_id)
        except Organization.DoesNotExist:
            raise PermissionDenied("You do not have permission to change member roles.")

        user = OrganizationMemberService.change_role(
            organization=organization,
            user_id=int(data.id),
            new_role=data.role,
            current_user=current_user,
        )

        user = (
            organization.users.filter(id=user.id)
            .annotate(_member_role=annotate_member_role(str(organization.id)))
            .first()
        )

        return cast(OrganizationMemberType, user)

from typing import Optional, Union, cast

import strawberry
import strawberry_django
from accounts.groups import GroupTemplateNames
from accounts.permissions import UserOrganizationPermissions
from accounts.selectors import (
    get_organization_member,
    get_organization_members,
    get_user_organization,
)
from common.graphql.extensions import PermissionedQuerySet
from common.graphql.types import DeletedObjectType
from common.permissions.utils import IsAuthenticated
from django.db import transaction
from django.db.models import QuerySet
from notes.permissions import NotePermissions
from organizations.models import Organization
from strawberry.types import Info
from strawberry_django import auth
from strawberry_django.auth.utils import get_current_user
from strawberry_django.mutations import resolvers
from strawberry_django.pagination import OffsetPaginated
from strawberry_django.permissions import HasPerm

from .models import User
from .services import organizations
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
        permission_classes=[IsAuthenticated],
        extensions=[
            PermissionedQuerySet(
                UserOrganizationPermissions.VIEW_ORG_MEMBERS,
                model=Organization,
                check_retval=False,
            )
        ],
    )
    def organization_member(self, info: Info, organization_id: str, user_id: str) -> OrganizationMemberType:
        organization = get_user_organization(
            info,
            organization_id,
            permission_denied_message="You do not have permission to view this organization's members.",
        )

        user = get_organization_member(organization=organization, user_id=int(user_id))
        if not user:
            raise PermissionError("You do not have permission to view this member.")

        return cast(OrganizationMemberType, user)

    @strawberry_django.offset_paginated(
        OffsetPaginated[OrganizationMemberType],
        permission_classes=[IsAuthenticated],
        extensions=[
            PermissionedQuerySet(
                UserOrganizationPermissions.VIEW_ORG_MEMBERS,
                model=Organization,
                check_retval=False,
            )
        ],
    )
    def organization_members(
        self, info: Info, organization_id: str, ordering: Optional[list[OrganizationMemberOrdering]] = None
    ) -> QuerySet[User]:
        organization = get_user_organization(
            info,
            organization_id,
            permission_denied_message="You do not have permission to view this organization's members.",
        )

        return get_organization_members(organization=organization)


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
        organization = get_user_organization(
            info,
            data.organization_id,
            permission_denied_message="You do not have permission to add members.",
        )

        user = organizations.member_add(
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
        organization = get_user_organization(
            info,
            data.organization_id,
            permission_denied_message="You do not have permission to remove members.",
        )

        user_id = organizations.member_remove(
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
        organization = get_user_organization(
            info,
            data.organization_id,
            permission_denied_message="You do not have permission to change member roles.",
        )

        organizations.member_change_role(
            organization=organization,
            user_id=int(data.id),
            role=data.role,
            current_user=current_user,
        )

        # Fetch user with role annotation for response
        user = get_organization_member(organization=organization, user_id=int(data.id))
        return cast(OrganizationMemberType, user)

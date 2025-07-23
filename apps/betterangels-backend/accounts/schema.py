import uuid
from typing import cast

import strawberry
import strawberry_django
from accounts.enums import OrgRoleEnum
from accounts.groups import GroupTemplateNames
from accounts.permissions import UserOrganizationPermissions
from common.graphql.types import DeletedObjectType
from common.permissions.utils import IsAuthenticated
from django.conf import settings
from django.contrib.sites.models import Site
from django.db import transaction
from django.db.models import Case, CharField, Exists, OuterRef, QuerySet, Value, When
from notes.permissions import NotePermissions
from organizations.backends import invitation_backend
from organizations.models import Organization, OrganizationUser
from strawberry.types import Info
from strawberry_django import auth
from strawberry_django.auth.utils import get_current_user
from strawberry_django.mutations import resolvers
from strawberry_django.pagination import OffsetPaginated
from strawberry_django.permissions import HasPerm
from strawberry_django.utils.query import filter_for_user

from .models import PermissionGroup, User
from .types import (
    AuthInput,
    AuthResponse,
    LoginInput,
    OrganizationMemberType,
    OrganizationType,
    OrgInvitationInput,
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
    current_user: UserType = auth.current_user()  # type: ignore

    @strawberry_django.offset_paginated(OffsetPaginated[OrganizationType], extensions=[HasPerm(NotePermissions.ADD)])
    def caseworker_organizations(self) -> QuerySet[Organization]:
        queryset: QuerySet[Organization] = Organization.objects.filter(
            permission_groups__name__icontains=GroupTemplateNames.CASEWORKER
        )
        return queryset

    @strawberry_django.field(extensions=[HasPerm(UserOrganizationPermissions.VIEW_ORG_MEMBERS)])
    def organization_member(self, info: Info, organization_id: str, user_id: str) -> OrganizationMemberType:
        user = cast(User, get_current_user(info))
        try:
            organization = filter_for_user(
                Organization.objects.filter(users=user),
                user,
                [UserOrganizationPermissions.VIEW_ORG_MEMBERS],
            ).get(id=organization_id)
        except Organization.DoesNotExist:
            raise PermissionError("You do not have permission to view this organization's members.")

        member: User = (
            organization.users.filter(id=user_id).annotate(_member_role=annotate_member_role(organization_id)).first()
        )
        if not member:
            raise PermissionError("You do not have permission to view this member.")

        return cast(OrganizationMemberType, member)

    @strawberry_django.offset_paginated(
        OffsetPaginated[OrganizationMemberType],
        extensions=[HasPerm(UserOrganizationPermissions.VIEW_ORG_MEMBERS)],
    )
    def organization_members(self, info: Info, organization_id: str) -> QuerySet[User]:
        user = cast(User, get_current_user(info))
        try:
            organization = filter_for_user(
                Organization.objects.filter(users=user),
                user,
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

    @strawberry.mutation
    def google_auth(self, input: AuthInput) -> AuthResponse:
        # The is a stub and logic is handled client-side by Apollo
        return AuthResponse(status_code="")

    @strawberry.mutation
    def apple_auth(self, input: AuthInput) -> AuthResponse:
        # The is a stub and logic is handled client-side by Apollo
        return AuthResponse(status_code="")

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def update_current_user(self, info: Info, data: UpdateUserInput) -> UserType:
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

    @strawberry_django.mutation(extensions=[HasPerm(UserOrganizationPermissions.ADD_ORG_MEMBER)])
    def add_organization_member(self, info: Info, data: OrgInvitationInput) -> OrganizationMemberType:
        current_user = get_current_user(info)
        invitation_data: dict = strawberry.asdict(data)

        try:
            organization = filter_for_user(
                Organization.objects.all(),
                current_user,
                [UserOrganizationPermissions.ADD_ORG_MEMBER],
            ).get(id=invitation_data["organization_id"])
        except Organization.DoesNotExist:
            raise PermissionError("You do not have permission to invite users.")

        with transaction.atomic():
            user, created = User.objects.get_or_create(
                email=invitation_data["email"],
                defaults={"username": str(uuid.uuid4()), "is_active": True},
            )
            if created:
                user.first_name = invitation_data["first_name"]
                user.last_name = invitation_data["last_name"]
                user.set_unusable_password()
                user.save()

            OrganizationUser.objects.create(user=user, organization=organization)

            invitation_backend().create_organization_invite(
                organization=organization, invited_by_user=current_user, invitee_user=user
            )

        site = Site.objects.get(pk=settings.SITE_ID)
        invitation_backend().send_invitation(
            user=user,
            sender=current_user,
            organization=organization,
            domain=site,
        )

        return cast(OrganizationMemberType, user)

import logging
from typing import Optional, Union, cast

import strawberry
import strawberry_django
from accounts.emails import send_welcome_email
from accounts.enums import OrgRoleEnum
from accounts.extensions import HasOrgPerm
from accounts.groups import ORG_ADMIN, ORG_SUPERUSER
from accounts.permissions import UserOrganizationPermissions, get_user_permitted_org
from accounts.role_manager import OrgRoleManager
from common.graphql.types import DeletedObjectType
from common.org_types import REGISTRY
from common.permissions.utils import IsAuthenticated, get_current_organization
from django.conf import settings
from django.contrib import auth
from django.contrib.sites.models import Site
from django.core.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from django.db.models import Case, CharField, Exists, OuterRef, QuerySet, Value, When
from organizations.backends import invitation_backend
from strawberry.types import Info
from strawberry_django.auth.utils import get_current_user
from strawberry_django.mutations import resolvers
from strawberry_django.pagination import OffsetPaginated
from strawberry_django.permissions import HasPerm

from .models import Organization, PermissionGroup, User
from .services import (
    create_organization_service,
    member_add,
    organization_remove_member,
)
from .types import (
    AuthResponse,
    ChangeOrganizationMemberRoleInput,
    CreateOrganizationInput,
    CreateOrganizationResponse,
    CurrentUserType,
    LoginInput,
    OrganizationMemberFilter,
    OrganizationMemberOrdering,
    OrganizationMemberType,
    OrganizationType,
    OrgInvitationInput,
    RemoveOrganizationMemberInput,
    UpdateUserInput,
    UpdateUserProfileInput,
    UserType,
)

logger = logging.getLogger(__name__)


def annotate_member_role(org_id: str) -> Case:
    is_superuser = Exists(
        PermissionGroup.objects.filter(
            organization_id=org_id,
            template__name=ORG_SUPERUSER.name,
            group__user=OuterRef("pk"),
        )
    )
    is_admin = Exists(
        PermissionGroup.objects.filter(
            organization_id=org_id,
            template__name=ORG_ADMIN.name,
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

    # TODO(SDB-178): migrate to HasOrgPerm — drop organization_id arg, read org from header
    @strawberry_django.field(
        permission_classes=[IsAuthenticated], extensions=[HasPerm(UserOrganizationPermissions.VIEW_ORG_MEMBERS)]
    )
    def organization_member(self, info: Info, organization_id: str, user_id: str) -> OrganizationMemberType:
        current_user = cast(User, get_current_user(info))
        organization = get_user_permitted_org(
            current_user, org_id=organization_id, permission=UserOrganizationPermissions.VIEW_ORG_MEMBERS
        )
        if organization is None:
            raise PermissionError("You do not have permission to view this organization's members.")

        user: User = (
            organization.users.filter(id=user_id).annotate(_member_role=annotate_member_role(organization_id)).first()
        )
        if not user:
            raise PermissionError("You do not have permission to view this member.")

        return cast(OrganizationMemberType, user)

    # TODO(SDB-178): migrate to HasOrgPerm — drop organization_id arg, read org from header
    @strawberry_django.offset_paginated(
        OffsetPaginated[OrganizationMemberType],
        permission_classes=[IsAuthenticated],
        extensions=[HasPerm(UserOrganizationPermissions.VIEW_ORG_MEMBERS)],
    )
    def organization_members(
        self,
        info: Info,
        organization_id: str,
        ordering: Optional[list[OrganizationMemberOrdering]] = None,
        filters: Optional[OrganizationMemberFilter] = None,
    ) -> QuerySet[User]:
        current_user = cast(User, get_current_user(info))
        organization = get_user_permitted_org(
            current_user, org_id=organization_id, permission=UserOrganizationPermissions.VIEW_ORG_MEMBERS
        )
        if organization is None:
            raise PermissionError("You do not have permission to view this organization's members.")

        queryset: QuerySet[User] = organization.users.all()

        return queryset.annotate(_member_role=annotate_member_role(organization_id))


@strawberry.type
class Mutation:
    @strawberry.mutation
    def logout(self, info: Info) -> bool:
        """Log out the current user and destroy their session.

        This local resolver exists because upgrading gunicorn also pulled in a
        newer strawberry-django stack that caused schema export to fail with a
        missing `Info` type resolution error. Revisit and simplify back to
        `auth.logout()` once that upstream issue is resolved.
        """
        user = get_current_user(info)
        ret = bool(user and user.is_authenticated)
        auth.logout(info.context.request)
        return ret

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
    def update_user_profile(self, info: Info, data: UpdateUserProfileInput) -> CurrentUserType:
        user = cast(User, get_current_user(info))

        user_data: dict = strawberry.asdict(data)
        user = resolvers.update(info, user, {**user_data, "id": user.pk})

        return cast(CurrentUserType, user)

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
        permission_classes=[IsAuthenticated], extensions=[HasOrgPerm(UserOrganizationPermissions.ADD_ORG_MEMBER)]
    )
    def add_organization_member(self, info: Info, data: OrgInvitationInput) -> OrganizationMemberType:
        current_user = get_current_user(info)
        org_id = get_current_organization(info)
        organization = Organization.objects.get(pk=org_id)

        template = REGISTRY.template(data.permission_template.value)  # type: ignore[attr-defined, union-attr]
        if template is None:
            valid = REGISTRY.invitable_template_names_for(organization)
            raise ValidationError(
                f"Invalid permission template '{data.permission_template.value}'. "  # type: ignore[attr-defined, union-attr]
                f"Available: {', '.join(valid)}"
            )

        user = member_add(
            email=data.email,
            first_name=data.first_name,
            last_name=data.last_name,
            middle_name=data.middle_name,
            organization=organization,
            permission_templates=(template,),
        )

        invitation_backend().create_organization_invite(
            organization=organization, invited_by_user=current_user, invitee_user=user
        )

        site = Site.objects.get(pk=settings.SITE_ID)
        invitation_backend().send_invitation(
            user=user,
            sender=current_user,
            organization=organization,
            domain=site,
            role_template=template,
        )

        return cast(OrganizationMemberType, user)

    @strawberry_django.mutation(
        permission_classes=[IsAuthenticated],
        extensions=[HasOrgPerm(UserOrganizationPermissions.REMOVE_ORG_MEMBER)],
    )
    def remove_organization_member(
        self,
        info: Info,
        data: RemoveOrganizationMemberInput,
    ) -> DeletedObjectType:
        current_user = cast(User, get_current_user(info))
        org_id = get_current_organization(info)
        organization = Organization.objects.get(pk=org_id)

        removed_id = organization_remove_member(
            organization=organization,
            user_id=int(data.id),
            removed_by=current_user,
        )

        return DeletedObjectType(id=removed_id)

    # ── Organization Creation ──────────────────────────────────────

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    def create_organization(self, info: Info, data: CreateOrganizationInput) -> CreateOrganizationResponse:
        """Create an organization for the authenticated user.

        Creates a new Organization with the requested org type, links the
        current user as owner, assigns the member-level role, and sends a
        welcome email.
        """
        current_user = cast(User, get_current_user(info))
        user, organization = create_organization_service(
            user=current_user,
            organization_name=data.organization_name,
            org_type_name=data.org_type,
        )

        templates = [t for t in REGISTRY.templates_for(organization) if t.welcome_html]
        for template in templates:
            send_welcome_email(user, organization, template)

        return CreateOrganizationResponse(user=cast(UserType, user), organization=cast(OrganizationType, organization))

    # ── Role Change ────────────────────────────────────────────────

    @strawberry_django.mutation(
        permission_classes=[IsAuthenticated],
        extensions=[HasOrgPerm(UserOrganizationPermissions.CHANGE_ORG_MEMBER_ROLE)],
    )
    def change_organization_member_role(
        self, info: Info, data: ChangeOrganizationMemberRoleInput
    ) -> OrganizationMemberType:
        """Promote or demote a member within an organization.

        Replaces all of the member's current org-scoped roles with the
        single requested template.  Requires the ``CHANGE_ORG_MEMBER_ROLE``
        permission.
        """
        org_id = get_current_organization(info)
        organization = Organization.objects.get(pk=org_id)

        template = REGISTRY.template(data.permission_template.value)  # type: ignore[attr-defined, union-attr]
        if template is None:
            valid = REGISTRY.invitable_template_names_for(organization)
            raise ValidationError(
                f"Invalid permission template '{data.permission_template.value}'. "  # type: ignore[attr-defined, union-attr]
                f"Available: {', '.join(valid)}"
            )

        target_user = User.objects.filter(
            id=data.user_id,
            organizations_organization=organization,
        ).first()
        if not target_user:
            raise PermissionDenied("Target user is not a member of this organization.")

        OrgRoleManager(organization).replace_roles(target_user, template)

        if hasattr(target_user, "_member_role"):
            object.__delattr__(target_user, "_member_role")
        return cast(OrganizationMemberType, target_user)

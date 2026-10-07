import logging
from typing import Optional, Union, cast

import strawberry
import strawberry_django
from common.graphql.org import resolve_org_or_deny
from common.graphql.types import DeletedObjectType
from common.org_types import REGISTRY
from common.permissions.utils import IsAuthenticated, require_can
from django.contrib import auth
from django.core.exceptions import PermissionDenied
from django.db import transaction
from django.db.models import Exists, OuterRef, QuerySet
from organizations.backends import invitation_backend
from strawberry.types import Info
from strawberry_django.auth.utils import get_current_user
from strawberry_django.mutations import resolvers
from strawberry_django.pagination import OffsetPaginated

from accounts.emails import base_url_for, send_welcome_emails_for_org
from accounts.permissions import UserOrganizationPermissions

from .annotations import (
    annotate_is_org_owner,
    annotate_member_role,
    annotate_membership_id,
    annotate_permission_templates,
)
from .models import OrganizationUser, PermissionGroup, User
from .services import (
    create_organization_service,
    member_add,
    member_roles_replace,
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
    OrgTypeEnum,
    PermissionTemplateEnum,
    RemoveOrganizationMemberInput,
    UpdateUserInput,
    UpdateUserProfileInput,
    UserType,
)

logger = logging.getLogger(__name__)


@strawberry.type
class Query:
    @strawberry_django.field(permission_classes=[IsAuthenticated])
    def current_user(self, info: Info) -> CurrentUserType:
        return get_current_user(info)  # type: ignore

    @strawberry_django.field(permission_classes=[IsAuthenticated])
    def organization_member(self, info: Info, organization_id: str, user_id: str) -> OrganizationMemberType:
        """A single org member — grant-only at the payload org (ADR 0001 §5.3).

        The org is carried as an argument (no header); authority is
        ``require_can(organizations.view_org_members)`` at that org — role-backed
        ORG_ADMIN/ORG_SUPERUSER backfilled Grants, or the global tier.  An
        unknown org id fails closed.
        """
        current_user = cast(User, get_current_user(info))
        org = resolve_org_or_deny(organization_id)
        require_can(current_user, UserOrganizationPermissions.VIEW_ORG_MEMBERS, org=org)

        user: User = (
            org.users.filter(id=user_id)
            .annotate(
                _member_role=annotate_member_role(organization_id),
                _is_org_owner=annotate_is_org_owner(organization_id),
                _permission_templates=annotate_permission_templates(organization_id),
                _membership_id=annotate_membership_id(organization_id),
            )
            .first()
        )
        if not user:
            raise PermissionError("You do not have permission to view this member.")

        return cast(OrganizationMemberType, user)

    @strawberry_django.offset_paginated(
        OffsetPaginated[OrganizationMemberType],
        permission_classes=[IsAuthenticated],
    )
    def organization_members(
        self,
        info: Info,
        organization_id: str,
        ordering: Optional[list[OrganizationMemberOrdering]] = None,
        filters: Optional[OrganizationMemberFilter] = None,
        org_type: Optional[OrgTypeEnum] = None,
        permission_template: Optional[PermissionTemplateEnum] = None,
    ) -> QuerySet[User]:
        """List an organization's members — grant-only at the payload org (ADR 0001 §5.3).

        The org is carried as an argument (no header); authority is
        ``require_can(organizations.view_org_members)`` at that org.  An unknown
        org id fails closed.
        """
        current_user = cast(User, get_current_user(info))
        org = resolve_org_or_deny(organization_id)
        require_can(current_user, UserOrganizationPermissions.VIEW_ORG_MEMBERS, org=org)

        queryset: QuerySet[User] = org.users.all()

        # When an org_type is provided, filter to members who have
        # at least one permission template from that org type's template set.
        # This allows interfaces (e.g. betterangels-admin vs shelter-operator)
        # to scope the member list to their relevant org type, even when
        # the organization has multiple types.
        if org_type is not None:
            org_config = REGISTRY.org_type(org_type.value)
            if org_config:
                template_names = [t.name for t in org_config.templates]
                has_org_type_template = Exists(
                    PermissionGroup.objects.filter(
                        organization_id=organization_id,
                        template__name__in=template_names,
                        user=OuterRef("pk"),
                    )
                )
                queryset = queryset.filter(has_org_type_template)

        # When a permission_template is provided, filter to members who have
        # that specific template (e.g. only Caseworkers).
        if permission_template is not None:
            has_template = Exists(
                PermissionGroup.objects.filter(
                    organization_id=organization_id,
                    template__name=permission_template.value,
                    user=OuterRef("pk"),
                )
            )
            queryset = queryset.filter(has_template)

        return queryset.annotate(
            _member_role=annotate_member_role(organization_id),
            _is_org_owner=annotate_is_org_owner(organization_id),
            _permission_templates=annotate_permission_templates(organization_id),
            _membership_id=annotate_membership_id(organization_id),
        )


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

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def add_organization_member(self, info: Info, data: OrgInvitationInput) -> OrganizationMemberType:
        """Invite a member — grant-only at the payload org (ADR 0001 §5.3).

        ``require_can(organizations.add_org_member)`` at ``data.organizationId``;
        no header is read.
        """
        current_user = cast(User, get_current_user(info))
        organization = resolve_org_or_deny(data.organization_id)
        require_can(current_user, UserOrganizationPermissions.ADD_ORG_MEMBER, org=organization)

        template = REGISTRY.get_template_or_raise(data.permission_template.value, organization)  # type: ignore[attr-defined, union-attr]

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

        invitation_backend().send_invitation(
            user=user,
            sender=current_user,
            organization=organization,
            base_url=base_url_for(template),
            role_template=template,
        )

        return cast(OrganizationMemberType, user)

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def remove_organization_member(
        self,
        info: Info,
        data: RemoveOrganizationMemberInput,
    ) -> DeletedObjectType:
        """Remove a member — row-keyed, grant-only at the membership's org.

        ``data.membershipId`` names the ``OrganizationUser`` row; the row's org
        authorizes (``require_can(organizations.remove_org_member)`` there) —
        mirrors teams' row-keyed delete.  A missing/unknown membership fails
        closed; no header is read.
        """
        current_user = cast(User, get_current_user(info))
        membership = (
            OrganizationUser.objects.select_related("organization", "user").filter(pk=data.membership_id).first()
        )
        if membership is None:
            raise PermissionDenied("You do not have permission to remove this member.")

        require_can(current_user, UserOrganizationPermissions.REMOVE_ORG_MEMBER, org=membership.organization)

        removed_id = organization_remove_member(
            organization=membership.organization,
            user_id=membership.user_id,
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

        send_welcome_emails_for_org(user, organization)

        return CreateOrganizationResponse(user=cast(UserType, user), organization=cast(OrganizationType, organization))

    # ── Role Change ────────────────────────────────────────────────

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def change_organization_member_role(
        self, info: Info, data: ChangeOrganizationMemberRoleInput
    ) -> OrganizationMemberType:
        """Set which of the organization's invitable roles a member holds.

        Row-keyed, grant-only at the membership's org (ADR 0001 §5.3):
        ``data.membershipId`` names the ``OrganizationUser`` row and its org
        authorizes ``require_can(organizations.change_org_member_role)``.  A
        missing/unknown membership fails closed; no header is read.

        The member ends up holding the single requested template and no other
        role the organization grants by invitation.  Roles it does not —
        ``Organization Admin``, ``Organization Superuser``, and anything granted
        by hand — are left alone; ``PermissionTemplateEnum`` cannot name them, so
        replacing every group would have demoted an org admin on any call.
        """
        current_user = cast(User, get_current_user(info))
        membership = (
            OrganizationUser.objects.select_related("organization", "user").filter(pk=data.membership_id).first()
        )
        if membership is None:
            raise PermissionDenied("You do not have permission to change this member's role.")

        organization = membership.organization
        require_can(current_user, UserOrganizationPermissions.CHANGE_ORG_MEMBER_ROLE, org=organization)

        template = REGISTRY.get_template_or_raise(data.permission_template.value, organization)  # type: ignore[attr-defined, union-attr]

        member_roles_replace(
            organization=organization,
            user_id=membership.user_id,
            permission_templates=(template,),
        )

        target_user = membership.user
        target_user._membership_id = membership.pk
        if hasattr(target_user, "_member_role"):
            object.__delattr__(target_user, "_member_role")
        return cast(OrganizationMemberType, target_user)

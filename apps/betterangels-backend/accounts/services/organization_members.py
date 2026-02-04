"""Service for organization member operations."""

import uuid
from typing import Optional

from accounts.enums import OrgRoleEnum
from accounts.groups import GroupTemplateNames
from accounts.models import PermissionGroup, User
from django.conf import settings
from django.contrib.sites.models import Site
from django.core.exceptions import ValidationError
from django.db import transaction
from organizations.backends import invitation_backend
from organizations.models import Organization, OrganizationOwner, OrganizationUser


class OrganizationMemberService:
    """Handles business logic for organization member operations."""

    @staticmethod
    def add(
        organization: Organization,
        email: str,
        first_name: str,
        last_name: str,
        middle_name: Optional[str],
        current_user: User,
    ) -> User:
        """
        Add a new member to an organization and send invitation.

        Args:
            organization: The organization to add the member to.
            email: Email address of the new member.
            first_name: First name of the new member.
            last_name: Last name of the new member.
            middle_name: Middle name of the new member.
            current_user: The user performing the action.

        Returns:
            The created or existing User object.

        Raises:
            ValidationError: If the user is already a member.
        """
        with transaction.atomic():
            user, created = User.objects.get_or_create(
                email=email,
                defaults={"username": str(uuid.uuid4()), "is_active": True},
            )
            if created:
                user.first_name = first_name
                user.last_name = last_name
                user.middle_name = middle_name
                user.set_unusable_password()
                user.save()

            try:
                OrganizationUser.objects.create(user=user, organization=organization)
            except Exception:
                raise ValidationError(f"{first_name} {last_name} is already a member of {organization.name}.")

            invitation_backend().create_organization_invite(
                organization=organization,
                invited_by_user=current_user,
                invitee_user=user,
            )

        site = Site.objects.get(pk=settings.SITE_ID)
        invitation_backend().send_invitation(
            user=user,
            sender=current_user,
            organization=organization,
            domain=site,
        )

        return user

    @staticmethod
    def remove(
        organization: Organization,
        user_id: int,
        current_user: User,
    ) -> int:
        """
        Remove a member from an organization.

        Args:
            organization: The organization to remove the member from.
            user_id: The ID of the user to remove.
            current_user: The user performing the action.

        Returns:
            The ID of the removed user.

        Raises:
            ValidationError: If the user is not a member, is the owner,
                or is removing themselves.
        """
        try:
            org_user = OrganizationUser.objects.get(
                organization=organization,
                user_id=user_id,
            )
        except OrganizationUser.DoesNotExist:
            raise ValidationError("User is not a member of this organization.")

        if OrganizationOwner.objects.filter(
            organization=organization,
            organization_user=org_user,
        ).exists():
            raise ValidationError("You cannot remove the organization owner. Transfer ownership first.")

        if user_id == current_user.pk:
            raise ValidationError("You cannot remove yourself from the organization.")

        org_user.delete()
        return user_id

    @staticmethod
    def change_role(
        organization: Organization,
        user_id: int,
        role: OrgRoleEnum,
        current_user: User,
    ) -> User:
        """
        Change a member's role in an organization.

        Args:
            organization: The organization.
            user_id: The ID of the user whose role to change.
            role: The new role to assign.
            current_user: The user performing the action.

        Returns:
            The updated User object.

        Raises:
            ValidationError: If the user is not a member, is the owner,
                or is changing their own role.
        """
        try:
            org_user = OrganizationUser.objects.select_related("user").get(
                organization=organization,
                user_id=user_id,
            )
        except OrganizationUser.DoesNotExist:
            raise ValidationError("User is not a member of this organization.")

        if OrganizationOwner.objects.filter(
            organization=organization,
            organization_user=org_user,
        ).exists():
            raise ValidationError("You cannot change the organization owner's role.")

        if user_id == current_user.pk:
            raise ValidationError("You cannot change your own role.")

        user: User = org_user.user

        # Map role enum to group template name
        role_to_template = {
            OrgRoleEnum.ADMIN: GroupTemplateNames.ORG_ADMIN,
            OrgRoleEnum.SUPERUSER: GroupTemplateNames.ORG_SUPERUSER,
            OrgRoleEnum.MEMBER: None,  # Members have no special group
        }

        template_name = role_to_template.get(role)

        # Get all role-related permission groups for this org
        role_groups = PermissionGroup.objects.filter(
            organization=organization,
            template__name__in=[GroupTemplateNames.ORG_ADMIN, GroupTemplateNames.ORG_SUPERUSER],
        ).select_related("group")

        with transaction.atomic():
            # Remove user from all role groups
            for perm_group in role_groups:
                user.groups.remove(perm_group.group)

            # Add user to the new role group if not MEMBER
            if template_name:
                new_group = PermissionGroup.objects.get(
                    organization=organization,
                    template__name=template_name,
                ).group
                user.groups.add(new_group)

        return user

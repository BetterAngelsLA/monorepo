from functools import cached_property
from typing import Union

from accounts.enums import OrgRoleEnum
from accounts.groups import GroupTemplateNames
from django.contrib.auth.models import AbstractBaseUser, AnonymousUser, Group
from django.db import transaction
from django.db.models import Exists, OuterRef, QuerySet
from organizations.models import Organization

from .models import PermissionGroup, PermissionGroupTemplate, User


def remove_organization_permission_group(organization: Organization) -> None:
    Group.objects.filter(permissiongroup__organization=organization).delete()


def add_default_org_permissions_to_user(user: User, organization: Organization) -> None:
    default_permission_group, _ = PermissionGroupTemplate.objects.get_or_create(
        # TODO: This is a hack for MVP. Not all orgs will default to caseworkers
        # we will want to have a default template selected for orgs on the org model.
        name=GroupTemplateNames.CASEWORKER
    )
    org_permission_group, _ = PermissionGroup.objects.get_or_create(
        organization=organization, template=default_permission_group
    )
    user.groups.add(org_permission_group.group)


def remove_org_group_permissions_from_user(user: User, organization: Organization) -> None:
    groups = Group.objects.filter(permissiongroup__organization=organization)
    user.groups.remove(*groups)


def get_user_permission_group(user: Union[AbstractBaseUser, AnonymousUser]) -> PermissionGroup:
    # WARNING: Temporary workaround for organization selection
    # TODO: Update once organization selection is implemented. Currently selects
    # the first organization with a default Caseworker role for the user.
    permission_group = (
        PermissionGroup.objects.select_related("organization", "group")
        .filter(
            organization__users=user.pk,
            name=GroupTemplateNames.CASEWORKER,
        )
        .first()
    )

    if not (permission_group and permission_group.group):
        raise PermissionError("User lacks proper organization or permissions")

    return permission_group


def get_outreach_authorized_users() -> QuerySet[User]:
    # TODO: Make unit test for this function
    authorized_permission_groups = [template.value for template in GroupTemplateNames]

    # Subquery to check if the user has any related permission group in an authorized group
    permission_group_exists = PermissionGroup.objects.filter(
        organization__users=OuterRef("pk"),  # Matches `User` to `Organization`
        template__name__in=authorized_permission_groups,
    )

    # Use Exists to avoid duplicate users without `distinct()`
    return User.objects.filter(Exists(permission_group_exists))


class OrgPermissionManager:
    """Manage org-specific user permissions."""

    def __init__(self, organization: Organization) -> None:
        self.organization: Organization = organization

    @cached_property
    def _admin_template(self) -> PermissionGroupTemplate:
        template, _ = PermissionGroupTemplate.objects.get_or_create(name=GroupTemplateNames.ORG_ADMIN)

        return template

    @cached_property
    def _superuser_template(self) -> PermissionGroupTemplate:
        template, _ = PermissionGroupTemplate.objects.get_or_create(name=GroupTemplateNames.ORG_SUPERUSER)

        return template

    @cached_property
    def _org_admin_group(self) -> PermissionGroup:
        group, _ = PermissionGroup.objects.get_or_create(
            organization=self.organization,
            template=self._admin_template,
        )

        return group

    @cached_property
    def _org_superuser_group(self) -> PermissionGroup:
        group, _ = PermissionGroup.objects.get_or_create(
            organization=self.organization,
            template=self._superuser_template,
        )

        return group

    @transaction.atomic
    def set_role(self, user: User, role: OrgRoleEnum) -> None:
        self.clear_permissions(user)

        if role == OrgRoleEnum.ADMIN:
            user.groups.add(self._org_admin_group.group)

        if role == OrgRoleEnum.SUPERUSER:
            user.groups.add(self._org_superuser_group.group)

    def clear_permissions(self, user: User) -> None:
        """Remove both admin and superuser perms."""
        user.groups.remove(self._org_admin_group.group)
        user.groups.remove(self._org_superuser_group.group)

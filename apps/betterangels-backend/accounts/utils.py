from typing import Union

from accounts.groups import GroupTemplateNames
from django.contrib.auth.models import AbstractBaseUser, AnonymousUser, Group
from organizations.models import Organization

from .models import PermissionGroup, PermissionGroupTemplate, User


def remove_organization_permission_group(organization: Organization) -> None:
    Group.objects.filter(permissiongroup__organization=organization).delete()


def add_default_org_permissions_to_user(user: User, organization: Organization) -> None:
    # TODO 2024.11.20: This is a hack for MVP. Once we have more permission group templates,
    # we'll need to store each org's default template.
    if user.email and "+demo@example.com" in user.email:
        template_name = GroupTemplateNames.DEMO
    else:
        template_name = GroupTemplateNames.CASEWORKER

    default_permission_group, _ = PermissionGroupTemplate.objects.get_or_create(name=template_name)
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
            organization__users=user,
            name__in=[GroupTemplateNames.CASEWORKER, GroupTemplateNames.DEMO],
        )
        .first()
    )

    if not (permission_group and permission_group.group):
        raise PermissionError("User lacks proper organization or permissions")

    return permission_group

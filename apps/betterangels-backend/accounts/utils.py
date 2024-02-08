from accounts.groups import GroupTemplateNames
from django.contrib.auth.models import Group

from .models import Organization, PermissionGroup, PermissionGroupTemplate, User


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


def remove_org_group_permissions_from_user(
    user: User, organization: Organization
) -> None:
    groups = Group.objects.filter(
        organizationpermissiongroup__organization=organization
    )
    user.groups.remove(*groups)

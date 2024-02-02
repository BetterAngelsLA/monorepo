# utils.py
from django.contrib.auth.models import Group

from .models import Organization, PermissionGroup, PermissionGroupTemplate, User


def add_user_to_org(user: User, organization: Organization) -> None:
    default_permission_group, _ = PermissionGroupTemplate.objects.get_or_create(
        name="default"
    )
    org_permission_group, _ = PermissionGroup.objects.get_or_create(
        organization=organization, template=default_permission_group
    )
    user.groups.add(org_permission_group.group)


def remove_user_from_org_groups(user: User, organization: Organization) -> None:
    groups = Group.objects.filter(
        organizationpermissiongroup__organization=organization
    )
    user.groups.remove(*groups)

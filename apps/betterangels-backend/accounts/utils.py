import logging
from functools import cached_property
from typing import Union

import waffle
from accounts.enums import OrgRoleEnum
from accounts.groups import GroupTemplateNames
from accounts.org_types import is_member_role
from django.apps.registry import Apps
from django.conf import settings
from django.contrib.auth.models import AbstractBaseUser, AnonymousUser, Group
from django.db import transaction
from organizations.models import Organization

from .models import OrganizationProfile, OrgType, PermissionGroup, PermissionGroupTemplate, User

logger = logging.getLogger(__name__)


def remove_organization_permission_group(organization: Organization) -> None:
    Group.objects.filter(permissiongroup__organization=organization).delete()


def _get_member_role_for_org(organization: Organization) -> str:
    """Determine the member role for an organization based on its org_types.

    Uses the first matching preset's member_role. Falls back to the first
    preset in ORG_TYPE_PRESETS if the org has no types assigned.
    """
    try:
        profile = organization.profile
        org_type_keys = list(profile.org_types.values_list("key", flat=True))
    except OrganizationProfile.DoesNotExist:
        org_type_keys = []

    # Find the first preset that matches one of the org's types
    for key in org_type_keys:
        if key in settings.ORG_TYPE_PRESETS:
            return settings.ORG_TYPE_PRESETS[key]["member_role"]

    # Fallback: first preset
    first_preset = next(iter(settings.ORG_TYPE_PRESETS.values()))
    return first_preset["member_role"]


def _get_templates_for_org(organization: Organization) -> list[str]:
    """Return all permission group template names that should exist for an org."""
    try:
        profile = organization.profile
        org_type_keys = list(profile.org_types.values_list("key", flat=True))
    except OrganizationProfile.DoesNotExist:
        org_type_keys = []

    templates: set[str] = set()
    for key in org_type_keys:
        if key in settings.ORG_TYPE_PRESETS:
            templates.update(settings.ORG_TYPE_PRESETS[key]["templates"])

    if not templates:
        # Fallback: first preset
        first_preset = next(iter(settings.ORG_TYPE_PRESETS.values()))
        templates.update(first_preset["templates"])

    return list(templates)


def is_org_type_default_template(template_name: str) -> bool:
    """Return True if *template_name* is the primary member template for any preset."""
    return is_member_role(template_name)


def add_default_org_permissions_to_user(user: User, organization: Organization) -> None:
    member_role = _get_member_role_for_org(organization)
    member_template, _ = PermissionGroupTemplate.objects.get_or_create(name=member_role)
    member_group, _ = PermissionGroup.objects.get_or_create(organization=organization, template=member_template)
    user.groups.add(member_group.group)


def create_default_org_permission_groups(organization: Organization) -> None:
    template_names = _get_templates_for_org(organization)

    for temp in template_names:
        template, _ = PermissionGroupTemplate.objects.get_or_create(name=temp)
        PermissionGroup.objects.get_or_create(organization=organization, template=template)


def remove_org_group_permissions_from_user(user: User, organization: Organization) -> None:
    groups = Group.objects.filter(permissiongroup__organization=organization)
    user.groups.remove(*groups)


def get_permission_group_for_org(
    user: Union[AbstractBaseUser, AnonymousUser], organization: Organization
) -> PermissionGroup:
    """Return the user's member permission group for the given organization.

    Derives the correct role from the organization's type preset configuration.
    Validates that the user actually belongs to the group.
    """
    member_role = _get_member_role_for_org(organization)
    permission_group = (
        PermissionGroup.objects.select_related("organization", "group")
        .filter(
            organization=organization,
            template__name=member_role,
        )
        .first()
    )

    if not (permission_group and permission_group.group):
        raise PermissionError("Organization does not have the expected permission group")

    if not user.groups.filter(id=permission_group.group_id).exists():
        raise PermissionError("User is not a member of this organization's permission group")

    return permission_group


def get_member_permission_group(organization_id: int) -> PermissionGroup:
    """Return the member permission group for an organization by ID.

    Use this when user access has already been verified (e.g., by PermissionedQuerySet)
    and you just need the group for assigning object permissions.
    Single query — does not re-verify membership.
    """
    permission_group = (
        PermissionGroup.objects.select_related("organization", "group")
        .filter(organization_id=organization_id)
        .exclude(template__name__in=[GroupTemplateNames.ORG_ADMIN, GroupTemplateNames.ORG_SUPERUSER])
        .first()
    )

    if not (permission_group and permission_group.group):
        raise PermissionError("Organization does not have a member permission group")

    return permission_group


def get_user_permission_group(user: Union[AbstractBaseUser, AnonymousUser]) -> PermissionGroup:
    """DEPRECATED: Legacy fallback for resolvers that don't yet receive organization_id.

    Selects the first organization where the user has a member role.
    Use get_permission_group_for_org() with an explicit organization instead.
    """
    logger.warning(
        "get_user_permission_group() is deprecated. Pass organization_id explicitly.",
        stacklevel=2,
    )
    # Find the first permission group for this user that is a member role (not admin/superuser)
    permission_group = (
        PermissionGroup.objects.select_related("organization", "group")
        .filter(
            organization__users=user.pk,
        )
        .exclude(template__name__in=[GroupTemplateNames.ORG_ADMIN, GroupTemplateNames.ORG_SUPERUSER])
        .first()
    )

    if not (permission_group and permission_group.group):
        raise PermissionError("User lacks proper organization or permissions")

    return permission_group


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


# migration utils
def create_missing_groups_for_org(
    apps: Apps,
    current_perm_group_templates: list[GroupTemplateNames],
    new_perm_group_templates: list[GroupTemplateNames],
) -> None:
    """Creates Groups and PermissionGroups for organizations.

    Use when creating new permission group templates.

    Args:
      apps: django app registry (django.apps)
      current_perm_group_templates: List of PermissionGroupTemplates. Organizations belonging to
        any matching permission group will be updated.
      new_perm_group_templates: List of PermissionGroupTemplates. A Group and PermissionGroup will
        be created for all provided templates.
    """

    Organization = apps.get_model("organizations", "Organization")
    Group = apps.get_model("auth", "Group")
    PermissionGroup = apps.get_model("accounts", "PermissionGroup")
    PermissionGroupTemplate = apps.get_model("accounts", "PermissionGroupTemplate")

    for template in new_perm_group_templates:
        perm_group_template = PermissionGroupTemplate.objects.get(name=template)
        # Can't use `permissions.set(perm_group_template.permissions.all())` in a migration,
        # so we pass permission ids
        perm_ids = perm_group_template.permissions.values_list("id", flat=True)

        orgs = Organization.objects.filter(permission_groups__template__name__in=current_perm_group_templates)

        for org in orgs:
            group_name = f"{org.name}_{perm_group_template.name}"
            group, _ = Group.objects.get_or_create(name=group_name)
            group.permissions.set(perm_ids)
            PermissionGroup.objects.get_or_create(
                organization=org, template=perm_group_template, group=group, name=template
            )


# ---------------------------------------------------------------------------
# Demo-environment email helpers
# ---------------------------------------------------------------------------

DEMO_LOGIN_EMAIL_SWITCH = "demo_login_email"


def demo_login_email(email: str) -> str:
    """Return *email* with ``+demo`` inserted before the ``@``.

    The mobile app uses the ``+demo`` tag to route the user to the demo
    API server.
    """
    local, domain = email.rsplit("@", 1)
    return f"{local}+demo@{domain}"


def demo_email_context(email: str) -> dict[str, object]:
    """Return template-context dict for the demo-login-email feature.

    When the ``demo_login_email`` waffle switch is active:
    * ``is_demo`` → ``True``
    * ``login_email`` → ``user+demo@domain``

    Otherwise ``is_demo`` is ``False`` and ``login_email`` equals *email*.
    """
    is_demo: bool = waffle.switch_is_active(DEMO_LOGIN_EMAIL_SWITCH)
    login_email = demo_login_email(email) if is_demo else email
    return {"is_demo": is_demo, "login_email": login_email}

import logging
from typing import Optional, Union

import waffle
from common.org_types import REGISTRY
from django.apps.registry import Apps
from django.contrib.auth.models import AbstractBaseUser, AnonymousUser, Group
from organizations.models import Organization

from .models import PermissionGroup, PermissionGroupTemplate, User

logger = logging.getLogger(__name__)


def remove_organization_permission_group(organization: Organization) -> None:
    Group.objects.filter(permissiongroup__organization=organization).delete()


def create_default_org_permission_groups(organization: Organization) -> None:
    """Create ``PermissionGroup`` rows for every template in *organization*.

    Uses :meth:`Registry.templates_for` so the result is org-type-aware —
    an outreach org gets Caseworker, Org Admin, Org Superuser; a shelter org
    gets Shelter Operator, Org Admin, Org Superuser.
    """
    for template_config in REGISTRY.templates_for(organization):
        template, _ = PermissionGroupTemplate.objects.get_or_create(name=template_config.name)
        PermissionGroup.objects.get_or_create(organization=organization, template=template)


def add_default_org_permissions_to_user(user: User, organization: Organization) -> None:
    """Add *user* to the (first) invitable member role group for *organization*."""
    invitable = REGISTRY.invitable_templates_for(organization)
    if not invitable:
        return
    member_config = invitable[0]
    member_template, _ = PermissionGroupTemplate.objects.get_or_create(name=member_config.name)
    member_group, _ = PermissionGroup.objects.get_or_create(organization=organization, template=member_template)
    user.groups.add(member_group.group)


def remove_org_group_permissions_from_user(user: User, organization: Organization) -> None:
    groups = Group.objects.filter(permissiongroup__organization=organization)
    user.groups.remove(*groups)


# ── Permission group resolvers ────────────────────────────────────────────


def get_user_permission_group(user: Union[AbstractBaseUser, AnonymousUser]) -> PermissionGroup:
    """DEPRECATED — use :func:`get_permission_group_for_org` with an explicit org.

    Legacy fallback that selects the first organization where the user has a
    member (non-admin, non-superuser) permission group.  Excludes Org Admin
    and Org Superuser templates so the returned group is always a member role.
    """
    logger.warning(
        "get_user_permission_group() is deprecated. Pass organization_id explicitly.",
        stacklevel=2,
    )
    from accounts.groups import ORG_ADMIN, ORG_SUPERUSER

    permission_group = (
        PermissionGroup.objects.select_related("organization", "group")
        .filter(organization__users=user.pk)
        .exclude(template__name__in=[ORG_ADMIN.name, ORG_SUPERUSER.name])
        .first()
    )

    if not (permission_group and permission_group.group):
        raise PermissionError("User lacks proper organization or permissions")

    return permission_group


def get_permission_group_for_org(
    user: Union[AbstractBaseUser, AnonymousUser], organization: Organization
) -> PermissionGroup:
    """Return the user's member permission group for *organization*.

    Validates that the organization has a member role and that *user*
    belongs to that group.
    """
    invitable = REGISTRY.invitable_templates_for(organization)
    if not invitable:
        raise PermissionError("Organization has no member role defined.")

    member_role = invitable[0]
    permission_group = (
        PermissionGroup.objects.select_related("organization", "group")
        .filter(organization=organization, template__name=member_role.name)
        .first()
    )

    if not (permission_group and permission_group.group):
        raise PermissionError("Organization does not have the expected permission group")

    if not hasattr(user, "groups") or not user.groups.filter(id=permission_group.group_id).exists():  # type: ignore[union-attr]
        raise PermissionError("User is not a member of this organization's permission group")

    return permission_group


def resolve_permission_group(
    user: Union[AbstractBaseUser, AnonymousUser],
    organization_id: Optional[str] = None,
) -> PermissionGroup:
    """Resolve the correct PermissionGroup for a mutation.

    If *organization_id* is provided, validates membership against that org.
    Otherwise falls back to the deprecated first-org heuristic.

    TODO(SDB-178): Remove fallback once mobile can pass organization_id.
    """
    if organization_id:
        from organizations.models import Organization

        organization = Organization.objects.get(id=organization_id)
        return get_permission_group_for_org(user, organization)
    return get_user_permission_group(user)


# ── Migration utilities ───────────────────────────────────────────────────


def create_missing_groups_for_org(
    apps: Apps,
    current_perm_group_templates: list[str],
    new_perm_group_templates: list[str],
) -> None:
    """Creates Groups and PermissionGroups for organizations.

    Use when creating new permission group templates.

    Args:
      apps: django app registry (django.apps)
      current_perm_group_templates: List of template name strings. Organizations
        belonging to any matching permission group will be updated.
      new_perm_group_templates: List of template name strings. A Group and
        PermissionGroup will be created for all provided templates.
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

from typing import TYPE_CHECKING, Union

import waffle
from accounts.groups import GroupTemplateNames
from django.apps.registry import Apps
from django.contrib.auth.models import AbstractBaseUser, AnonymousUser, Group
from django.db import transaction
from django.db.models import Exists, OuterRef, QuerySet
from organizations.models import Organization

from .models import PermissionGroup, PermissionGroupTemplate, User


def remove_organization_permission_group(organization: Organization) -> None:
    Group.objects.filter(permissiongroup__organization=organization).delete()


def add_default_org_permissions_to_user(user: User, organization: Organization) -> None:
    caseworker_permission_group, _ = PermissionGroupTemplate.objects.get_or_create(
        # TODO: This is a hack for MVP. Not all orgs will default to caseworkers
        # we will want to have a default template selected for orgs on the org model.
        name=GroupTemplateNames.CASEWORKER
    )
    org_caseworker_group, _ = PermissionGroup.objects.get_or_create(
        organization=organization, template=caseworker_permission_group
    )
    user.groups.add(org_caseworker_group.group)


def create_default_org_permission_groups(organization: Organization) -> None:
    default_templates = [
        GroupTemplateNames.CASEWORKER,
        GroupTemplateNames.ORG_ADMIN,
        GroupTemplateNames.ORG_SUPERUSER,
    ]

    for temp in default_templates:
        template, _ = PermissionGroupTemplate.objects.get_or_create(name=temp)
        PermissionGroup.objects.get_or_create(organization=organization, template=template)


def remove_org_group_permissions_from_user(user: User, organization: Organization) -> None:
    groups = Group.objects.filter(permissiongroup__organization=organization)
    user.groups.remove(*groups)


def get_user_permission_group(user: Union[AbstractBaseUser, AnonymousUser]) -> PermissionGroup:
    """Return the first Caseworker ``PermissionGroup`` for *user*.

    .. deprecated::
        Use :func:`resolve_permission_group` instead.  This function
        hardcodes the Caseworker role and only works for users who
        belong to a single outreach-type organization.
    """
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


def resolve_permission_group(user: User, org_id: str) -> PermissionGroup:
    """Return the member-level ``PermissionGroup`` for *user* in *org_id*.

    This is the multi-org-aware replacement for
    :func:`get_user_permission_group`.  It reads the organization's
    ``org_types`` from the registry to determine the correct member
    role (e.g. "Caseworker" for outreach, "Shelter Operator" for
    shelters).

    Raises :class:`~django.core.exceptions.ValidationError` if the
    organization doesn't exist, the user is not a member, the org has
    no ``org_types``, or no matching ``PermissionGroup`` is found.
    """
    from accounts.services import get_user_permission_group_for_org

    return get_user_permission_group_for_org(user, org_id)


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


if TYPE_CHECKING:
    from common.permissions.config import TemplateConfig


class OrgPermissionManager:
    """Manage org-scoped permission groups for a user.

    Provides mechanical operations — adding, removing, and replacing
    permission groups.  Business rules (e.g. "cannot remove the org
    owner") belong in the calling layer, not here.
    """

    def __init__(self, organization: Organization) -> None:
        self.organization: Organization = organization

    # ── Public API ──────────────────────────────────────────────────────

    @transaction.atomic
    def add_permissions(self, user: User, *templates: TemplateConfig) -> None:
        """Add one or more permission groups to *user*.

        ``templates`` are :class:`~common.permissions.config.TemplateConfig`
        objects such as :data:`~notes.groups.CASEWORKER`.

        Raises :class:`~django.core.exceptions.ObjectDoesNotExist` if no
        ``PermissionGroup`` exists for a given template on this organization.
        """
        for template_config in templates:
            permission_group = PermissionGroup.objects.get(
                organization=self.organization,
                template__name=template_config.name,
            )
            user.groups.add(permission_group.group)

    @transaction.atomic
    def remove_permissions(self, user: User, *templates: TemplateConfig) -> None:
        """Remove specific permission groups from *user*."""
        for template_config in templates:
            permission_group = PermissionGroup.objects.get(
                organization=self.organization,
                template__name=template_config.name,
            )
            user.groups.remove(permission_group.group)

    @transaction.atomic
    def clear_permissions(self, user: User) -> None:
        """Remove **all** org-scoped permission groups from *user*."""
        groups = Group.objects.filter(permissiongroup__organization=self.organization)
        user.groups.remove(*groups)

    @transaction.atomic
    def replace_permissions(self, user: User, *templates: TemplateConfig) -> None:
        """Replace all org-scoped groups.  Convenience: clear + add."""
        self.clear_permissions(user)
        self.add_permissions(user, *templates)


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

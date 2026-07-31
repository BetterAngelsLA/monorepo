"""Utilities kept here to avoid circular imports between apps.

Business logic lives in :mod:`accounts.services`.
Read-only queries live in :mod:`accounts.selectors`.
"""

import waffle
from django.apps.registry import Apps

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

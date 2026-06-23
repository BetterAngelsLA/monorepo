import logging
from typing import Any

from django.conf import settings
from django.db import transaction
from django.db.models.signals import post_migrate
from django.dispatch import receiver
from organizations.models import Organization

from .models import PermissionGroupTemplate, User

logger = logging.getLogger(__name__)

# ── Single post_migrate entry point (order is guaranteed within) ──────


@receiver(post_migrate)
def setup_local_dev_data(sender: Any, **kwargs: Any) -> None:
    """Create test users, org, and assign roles — then sync permissions.

    Everything runs inside one receiver so ordering is guaranteed:
    users exist before the org references them, the org exists before
    the permission sync iterates it.
    """
    if not settings.IS_LOCAL_DEV:
        return

    _ensure_test_users()
    _ensure_test_org_and_roles()
    _sync_all_org_permission_groups()


# ── Step helpers ──────────────────────────────────────────────────────


def _ensure_test_users() -> None:
    """Idempotent: create admin + agent with known passwords."""
    admin, _ = User.objects.get_or_create(
        username="admin",
        defaults={"email": "admin@example.com", "password": "password"},
    )
    User.objects.filter(username="admin").update(is_superuser=True, is_staff=True)
    if not admin.check_password("password"):
        admin.set_password("password")
        admin.save(update_fields=["password"])

    agent, _ = User.objects.get_or_create(
        username="agent",
        defaults={
            "email": "agent@example.com",
            "password": "password",
            "first_name": "Carolyn",
        },
    )
    if not agent.check_password("password"):
        agent.set_password("password")
        agent.save(update_fields=["password"])


def _ensure_test_org_and_roles() -> None:
    """Idempotent: create test_org with presets, assign roles to admin + agent."""
    from accounts.groups import ORG_ADMIN
    from accounts.services import create_organization_with_presets, member_add
    from notes.groups import CASEWORKER
    from shelters.groups import SHELTER_OPERATOR

    admin = User.objects.get(username="admin")
    agent = User.objects.get(username="agent")

    test_org, created = Organization.objects.get_or_create(name="test_org")
    if created:
        test_org = create_organization_with_presets(
            name="test_org",
            preset_names=["shelter", "outreach"],
            owner=admin,
            owner_roles=(ORG_ADMIN, SHELTER_OPERATOR, CASEWORKER),
        )

    # member_add is idempotent — only grants templates not already held.
    member_add(
        email=agent.email or "agent@example.com",
        first_name=agent.first_name or "",
        last_name=agent.last_name or "",
        middle_name=None,
        organization=test_org,
        permission_templates=(SHELTER_OPERATOR, CASEWORKER),
    )


def _sync_all_org_permission_groups() -> None:
    """Create missing PermissionGroups from presets, then sync permissions.

    Iterates every registered org-type preset and creates any
    ``PermissionGroup`` records that don't exist yet (``get_or_create``),
    then syncs the Django ``Group.permissions`` for all existing groups.

    Adding a new template to a preset automatically propagates to every
    org on the next ``post_migrate`` — no migration needed.
    """
    from common.org_types import REGISTRY

    from .models import PermissionGroup

    # 1. Ensure every org has a PermissionGroup for every template in its presets.
    for org in Organization.objects.all():
        org_type_values = org.profile.org_types if hasattr(org, "profile") else []
        for org_type_value in org_type_values:
            org_config = REGISTRY.org_type(org_type_value.value)
            if org_config is None:
                continue
            for template_config in org_config.templates:
                permission_group_template, _ = PermissionGroupTemplate.objects.get_or_create(
                    name=template_config.name,
                )
                PermissionGroup.objects.get_or_create(
                    organization=org,
                    template=permission_group_template,
                )

    # 2. Sync the Django Group permissions for every existing group.
    template_names = REGISTRY.template_names()

    with transaction.atomic():
        templates = PermissionGroupTemplate.objects.filter(name__in=template_names).prefetch_related(
            "permissions", "permissiongroup_set__group"
        )

        for template in templates:
            perms = list(template.permissions.all())
            for pgt in template.permissiongroup_set.all():
                pgt.group.permissions.set(perms)

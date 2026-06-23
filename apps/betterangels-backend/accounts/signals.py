import logging
from typing import Any

from django.conf import settings
from django.db import transaction
from django.db.models.signals import post_migrate
from django.dispatch import receiver
from organizations.models import Organization

from .models import PermissionGroupTemplate, User

logger = logging.getLogger(__name__)

# ── Local dev data setup ──────────────────────────────────────────────


@receiver(post_migrate)
def setup_local_dev_data(sender: Any, **kwargs: Any) -> None:
    """Create test users and org — local dev only.

    Role assignment is deferred to ``sync_all_org_permission_groups``
    which runs after all migration app tables exist.  This avoids
    ``PermissionGroup.DoesNotExist`` when the signal fires before
    the accounts app is fully migrated.
    """
    if not settings.IS_LOCAL_DEV:
        return

    _ensure_test_users()
    _ensure_test_org()


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


def _ensure_test_org() -> None:
    """Idempotent: create test_org with presets and owner (no role assignment yet)."""
    from accounts.groups import ORG_ADMIN
    from accounts.services import create_organization_with_presets
    from notes.groups import CASEWORKER
    from shelters.groups import SHELTER_OPERATOR

    admin = User.objects.get(username="admin")

    test_org, created = Organization.objects.get_or_create(name="test_org")
    if created:
        create_organization_with_presets(
            name="test_org",
            preset_names=["shelter", "outreach"],
            owner=admin,
            owner_roles=(ORG_ADMIN, SHELTER_OPERATOR, CASEWORKER),
        )


# ── Permission sync (all environments) ────────────────────────────────


@receiver(post_migrate)
def sync_all_org_permission_groups(sender: Any, **kwargs: Any) -> None:
    """Reconcile every org's PermissionGroups against current presets.

    Also assigns test-agent roles on local dev (safe to call repeatedly
    — ``member_add`` is idempotent).
    """
    from accounts.services import member_add, reconcile_org_groups as reconcile
    from notes.groups import CASEWORKER
    from shelters.groups import SHELTER_OPERATOR

    # The accounts app tables may not be ready when this fires for other
    # apps; skip gracefully until the final post_migrate run.
    try:
        for org in Organization.objects.all():
            reconcile(org)
    except Exception:
        return

    _sync_template_permissions()

    if not settings.IS_LOCAL_DEV:
        return

    try:
        agent = User.objects.get(username="agent")
        test_org = Organization.objects.get(name="test_org")
        member_add(
            email=agent.email or "agent@example.com",
            first_name=agent.first_name or "",
            last_name=agent.last_name or "",
            middle_name=None,
            organization=test_org,
            permission_templates=(SHELTER_OPERATOR, CASEWORKER),
        )
    except Exception:
        pass

def _sync_template_permissions() -> None:
    """Sync Django Group.permissions for all registered templates."""
    from common.org_types import REGISTRY

    template_names = REGISTRY.template_names()
    with transaction.atomic():
        templates = PermissionGroupTemplate.objects.filter(name__in=template_names).prefetch_related(
            "permissions", "permissiongroup_set__group"
        )
        for template in templates:
            perms = list(template.permissions.all())
            for pgt in template.permissiongroup_set.all():
                pgt.group.permissions.set(perms)

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


@receiver(post_migrate, dispatch_uid="setup_local_dev_data")
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
        defaults={
            "email": "admin@example.com",
            "password": "password",
            "first_name": "Admin",
            "has_accepted_privacy_policy": True,
            "has_accepted_tos": True,
        },
    )
    User.objects.filter(username="admin").update(
        is_superuser=True,
        is_staff=True,
        first_name="Admin",
        has_accepted_privacy_policy=True,
        has_accepted_tos=True,
    )
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
    """Idempotent: ensure test_org exists with presets and admin as owner.

    Role assignment is handled later by sync_all_org_permission_groups.
    Called on every post_migrate because the first signal may fire before
    all apps' tables/permission templates are ready.
    """
    from accounts.services import create_organization_with_presets

    admin = User.objects.get(username="admin")

    create_organization_with_presets(
        name="test_org",
        preset_names=["shelter", "outreach"],
        owner=admin,
        owner_roles=(),  # roles assigned by sync_all_org_permission_groups
    )


# ── Permission sync (all environments) ────────────────────────────────


@receiver(post_migrate, dispatch_uid="sync_all_org_permission_groups")
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
        from accounts.groups import ORG_ADMIN

        test_org = Organization.objects.get(name="test_org")
        admin = User.objects.get(username="admin")
        agent = User.objects.get(username="agent")

        member_add(
            email=admin.email or "admin@example.com",
            first_name="Admin",
            last_name="User",
            middle_name=None,
            organization=test_org,
            permission_templates=(ORG_ADMIN, SHELTER_OPERATOR, CASEWORKER),
        )
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
    from django.contrib.auth.models import Permission
    from django.db.models import Q

    template_names = REGISTRY.template_names()
    with transaction.atomic():
        templates = PermissionGroupTemplate.objects.filter(name__in=template_names).prefetch_related(
            "permissions", "permissiongroup_set__group"
        )

        for template_db in templates:
            # Sync template permissions from REGISTRY definition → DB.
            template_config = REGISTRY.template(template_db.name)
            if template_config and template_config.permissions:
                perm_filters = Q()
                for perm_str in template_config.permissions:
                    app_label, codename = perm_str.split(".", 1)
                    perm_filters |= Q(codename=codename, content_type__app_label=app_label)
                template_db.permissions.set(Permission.objects.filter(perm_filters))

            # Sync group permissions from template → groups.
            perms = list(template_db.permissions.all())
            for pgt in template_db.permissiongroup_set.all():
                pgt.group.permissions.set(perms)

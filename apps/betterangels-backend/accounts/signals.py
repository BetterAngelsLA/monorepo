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
    """Idempotent: create test_org with presets and owner (no role assignment yet)."""
    from accounts.models import OrganizationProfile, OrgTypeChoices
    from accounts.services import reconcile_org_groups
    from common.org_types import REGISTRY

    admin = User.objects.get(username="admin")

    test_org, _ = Organization.objects.get_or_create(name="test_org")

    # Ensure profile and presets exist on the test organization.
    # In local development, the first post_migrate signal might create test_org empty
    # before all apps' tables/permission templates are ready. On subsequent runs,
    # we need to make sure the presets are updated and reconciled.
    org_types = []
    for preset_name in ["shelter", "outreach"]:
        org_config = REGISTRY.org_type(preset_name)
        if org_config:
            org_types.append(org_config.name)

    OrganizationProfile.objects.update_or_create(
        organization=test_org,
        defaults={"org_types": [OrgTypeChoices(org_type) for org_type in org_types]},
    )
    reconcile_org_groups(test_org)

    if not test_org.users.filter(pk=admin.pk).exists():
        test_org.add_user(admin)


# ── Permission sync (all environments) ────────────────────────────────


@receiver(post_migrate)
def create_test_organization(sender: Any, **kwargs: Any) -> None:
    if settings.IS_LOCAL_DEV and not Organization.objects.filter(name="test_org").exists():
        from notes.groups import CASEWORKER
        from shelters.groups import SHELTER_OPERATOR

        from accounts.groups import ORG_ADMIN

        from .role_manager import OrgRoleManager
        from .services import create_organization_with_presets

        test_users = list(User.objects.filter(username__in=["admin", "agent"]))

        if not test_users:
            logger.warning("test_org not created: admin and agent users do not exist yet.")
            return

        owner = next((u for u in test_users if u.username == "admin"), test_users[0])

        org = create_organization_with_presets(
            name="test_org",
            preset_names=["outreach", "shelter"],
            owner=owner,
            owner_roles=(CASEWORKER, SHELTER_OPERATOR, ORG_ADMIN),
        )

        for test_user in test_users:
            if test_user.pk != owner.pk:
                org.add_user(test_user)
                OrgRoleManager(org).add_roles(test_user, CASEWORKER, SHELTER_OPERATOR)


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

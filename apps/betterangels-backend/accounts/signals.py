import logging

from django.conf import settings
from django.contrib.auth.models import Group
from django.db import DatabaseError
from organizations.models import Organization

from .models import PermissionGroup, User

logger = logging.getLogger(__name__)


# ── auth.Group teardown ───────────────────────────────────────────────


def delete_orphaned_group(sender: object, instance: PermissionGroup, **kwargs: object) -> None:
    """Delete the ``auth.Group`` a removed ``PermissionGroup`` was scoping.

    A ``PermissionGroup`` exists only to scope one ``auth.Group`` to an
    organization and role, so the group must not outlive it — an orphaned group
    still grants its permissions to every member while no longer being reachable
    for revocation.

    This is a ``post_delete`` receiver rather than a ``delete()`` override
    because the override was silently skipped by the two paths that matter most:
    queryset deletes (used by reconciliation) and cascades (deleting an
    organization).  Registering the receiver also opts the model out of Django's
    fast-delete path, which is what guarantees it runs during a cascade.
    """
    Group.objects.filter(pk=instance.group_id).delete()


# ── Local dev data setup ──────────────────────────────────────────────
# Connected via AppConfig.ready() with sender=self — fires once, not per-app.


def setup_local_dev_data(sender: object, **kwargs: object) -> None:
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
# Connected via AppConfig.ready() with sender=self — fires once, not per-app.


def sync_all_org_permission_groups(sender: object, **kwargs: object) -> None:
    """Reconcile every org's PermissionGroups against current presets.

    Also assigns test-agent roles on local dev (safe to call repeatedly
    — ``member_add`` is idempotent).
    """
    from accounts.seed import sync_group_permissions
    from accounts.services import member_add, reconcile_org_groups as reconcile
    from notes.groups import CASEWORKER
    from shelters.groups import SHELTER_OPERATOR

    # The accounts app tables may not be ready when this fires for other apps;
    # skip gracefully until the final post_migrate run.  Scoped to DatabaseError
    # so a logic error surfaces instead of silently abandoning reconciliation for
    # every remaining organization.
    try:
        organizations = list(Organization.objects.all())
    except DatabaseError:
        logger.warning("Skipping org permission sync — accounts tables not ready yet.", exc_info=True)
        return

    for org in organizations:
        reconcile(org)

    sync_group_permissions()

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

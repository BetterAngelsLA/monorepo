import logging

from django.conf import settings
from django.db import OperationalError, ProgrammingError, transaction
from organizations.models import Organization

from .models import PermissionGroupTemplate, User

logger = logging.getLogger(__name__)

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
    from accounts.services import member_add, reconcile_org_groups as reconcile
    from notes.groups import CASEWORKER
    from shelters.groups import SHELTER_OPERATOR

    # A full `migrate` applies every migration before emitting post_migrate,
    # so the tables always exist by the time this runs.  A *targeted*
    # `migrate <app>` can fire it against a database where another app's
    # tables are still missing -- tolerate only that, and only loudly.
    #
    # Anything else must propagate.  This used to swallow every exception and
    # return, which also skipped _sync_template_permissions() below: a deploy
    # could silently leave every organization on stale permissions and still
    # report success.
    try:
        for org in Organization.objects.all():
            reconcile(org)
    except ProgrammingError, OperationalError:
        logger.warning(
            "Skipping organization permission sync: the schema is incomplete. "
            "Expected only during a targeted `migrate <app>`; a full migrate should never reach this.",
            exc_info=True,
        )
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
        # Local-dev convenience only -- never fail a migrate for it, but do
        # not hide it either.
        logger.warning("Could not assign local dev test-agent roles.", exc_info=True)


def _sync_template_permissions() -> None:
    """Sync Django Group.permissions for every PermissionGroupTemplate.

    Templates registered in the ``REGISTRY`` are refreshed from their
    ``TemplateConfig.permissions`` definition.  Non-registry templates
    (e.g. ``Global Shelter Operator``) are refreshed from the
    ``ALL_TEMPLATES`` list in ``accounts.seed`` — so that permission
    changes to ANY template are picked up on the next ``post_migrate``.
    """
    from common.org_types import REGISTRY
    from django.contrib.auth.models import Permission

    from accounts.seed import ALL_TEMPLATES

    configs: dict[str, list[tuple[str, str]]] = {}
    app_labels: set[str] = set()
    codenames: set[str] = set()

    def _add(name: str, perms: list[str]) -> None:
        parsed = [(ps.split(".", 1)[0], ps.split(".", 1)[1]) for ps in perms]
        configs[name] = parsed
        for a, c in parsed:
            app_labels.add(a)
            codenames.add(c)

    for name in REGISTRY.template_names():
        if cfg := REGISTRY.template(name):
            _add(name, cfg.permissions or [])
    for tc in ALL_TEMPLATES:
        if tc.name not in configs:
            _add(tc.name, tc.permissions or [])

    if not app_labels:
        return

    # ── Resolve all permissions in one query (no object instantiation) ──
    all_perm_ids: dict[tuple[str, str], int] = {
        (a, c): pk
        for a, c, pk in Permission.objects.filter(
            content_type__app_label__in=app_labels, codename__in=codenames
        ).values_list("content_type__app_label", "codename", "pk")
    }

    # ── Pre-compute wanted IDs per template ──
    wanted_by_template: dict[str, set[int]] = {
        name: {all_perm_ids[k] for k in perms if k in all_perm_ids} for name, perms in configs.items()
    }

    with transaction.atomic():
        # Prefetch permissions so .all() calls hit the cache, not the DB.
        templates = PermissionGroupTemplate.objects.prefetch_related(
            "permissions", "permissiongroup_set__group__permissions"
        )

        for template_db in templates:
            # Compute existing IDs once (uses prefetch).
            existing_ids = {p.pk for p in template_db.permissions.all()}

            # Sync template perms from config.
            if (wanted := wanted_by_template.get(template_db.name)) is not None and wanted != existing_ids:
                template_db.permissions.set(wanted)
                existing_ids = wanted

            # Sync group perms from template.  All prefetched — no queries.
            for pgt in template_db.permissiongroup_set.all():
                group_ids = {p.pk for p in pgt.group.permissions.all()}
                if existing_ids != group_ids:
                    pgt.group.permissions.set(existing_ids)

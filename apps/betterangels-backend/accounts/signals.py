import logging
from typing import Any

from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.db import DatabaseError
from django.db.models import Model
from organizations.models import Organization

from .models import User


def cleanup_orphan_object_grants(sender: object, instance: Model, **kwargs: object) -> None:
    """Finding F3 — a deleted row's object grants are orphans; drop them.

    Connected in ``AppConfig.ready`` to every object-grant candidate model
    (ADR 0001 §2.5).  Runtime-gated on ``object_grant_whitelist``, which is
    itself gated by the ``object_grants_enabled`` waffle switch: while the
    feature is off the handler returns before issuing any SQL, so deleting a
    row costs no extra query.
    """
    from common.permissions.object_grants import object_grant_whitelist

    model = type(instance)
    if not any(issubclass(model, cls) for cls in object_grant_whitelist()):
        return

    from django.contrib.contenttypes.models import ContentType

    from .models import Grant

    ct = ContentType.objects.get_for_model(model)
    Grant.objects.filter(scope_object_type=ct, scope_object_id=instance.pk).delete()  # type: ignore[attr-defined]


logger = logging.getLogger(__name__)


# ── Local dev data setup ──────────────────────────────────────────────
# Connected via AppConfig.ready() with sender=self — fires once, not per-app.

TEST_ORG_NAME = "test_org"


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

    # The idempotency this seeding relies on lives here, not in the service:
    # create_organization_with_presets always creates, so that naming an existing
    # organization cannot join it.
    if Organization.objects.filter(name=TEST_ORG_NAME).exists():
        return

    create_organization_with_presets(
        name=TEST_ORG_NAME,
        preset_names=["shelter", "outreach"],
        owner=User.objects.get(username="admin"),
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

    if not settings.IS_LOCAL_DEV:
        return

    try:
        from accounts.groups import ORG_ADMIN

        test_org = Organization.objects.get(name=TEST_ORG_NAME)
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
    except ObjectDoesNotExist, DatabaseError:
        # The test org, its users, or its permission groups may not exist yet on an
        # early post_migrate run.  Scoped like the reconcile guard above so a logic
        # error here surfaces instead of leaving the dev fixtures silently roleless.
        logger.warning("Skipping local dev role assignment — test org or users not ready yet.", exc_info=True)


# ── Membership ↔ Grant mirror (ADR 0001 §4 phase 2) ─────────────────────


def mirror_group_membership_grants(
    sender: object,
    instance: Any,
    action: str,
    reverse: bool,
    pk_set: Any,
    **kwargs: object,
) -> None:
    """Keep role-backed ``PermissionGroup`` memberships and Grants in step.

    Wired to ``User.groups.through``, so every writer keeps the invariant —
    the manager, the user admin, scripts, the shell — and reverse writes
    (``permission_group.user_set.add/remove/clear``) are handled too.

    A cascading delete of a ``PermissionGroup`` (teardown retiring a legacy
    row) does **not** emit ``m2m_changed`` — Django fast-deletes the through
    rows — so the Grants, the successor authority, outlive the legacy row.
    That asymmetry is deliberate: membership edges revoke, teardown does not.
    """
    from accounts.models import PermissionGroup, User
    from accounts.role_manager import mirror_membership_grants, unmirror_membership_grants

    if action == "pre_clear":
        # post_clear carries no pk_set; remember what is about to be cleared so
        # the mirror is dropped for exactly those rows.
        if reverse:
            instance.__dict__["_grant_mirror_pre_clear_users"] = list(instance.user_set.all())
        else:
            # ``User.groups`` yields ``Group`` rows, not the ``PermissionGroup``
            # children — resolve the role-backed subset explicitly.
            group_ids = list(instance.groups.values_list("pk", flat=True))
            instance.__dict__["_grant_mirror_pre_clear_groups"] = list(
                PermissionGroup.objects.filter(pk__in=group_ids).select_related("template", "organization")
            )
        return

    if action not in {"post_add", "post_remove", "post_clear"}:
        return
    if action != "post_clear" and not pk_set:
        return

    if reverse:
        if not isinstance(instance, PermissionGroup):
            return
        if action == "post_clear":
            users = instance.__dict__.pop("_grant_mirror_pre_clear_users", [])
        else:
            users = list(User.objects.filter(pk__in=pk_set or []))
        groups = [instance]
    else:
        users = [instance]
        if action == "post_clear":
            groups = instance.__dict__.pop("_grant_mirror_pre_clear_groups", [])
        else:
            groups = list(
                PermissionGroup.objects.filter(pk__in=pk_set or []).select_related("template", "organization")
            )

    for user in users:
        if action == "post_add":
            mirror_membership_grants(user, groups)
        else:
            unmirror_membership_grants(user, groups)

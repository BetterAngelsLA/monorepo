from django.apps import AppConfig
from django.db.models.signals import m2m_changed, post_migrate


def _seed_on_migrate(sender: AppConfig, **kwargs: object) -> None:
    from accounts.seed import retire_superseded_phantom_permissions, seed_permission_templates
    from accounts.services import (
        backfill_caseworker_grants,
        backfill_global_role_members,
        backfill_org_admin_grants,
        backfill_shelter_grants,
        sync_roles,
    )

    seed_permission_templates()
    sync_roles()
    # Org-admin and caseworker conversion must run before any reconcile retires
    # the legacy rows: sync_roles creates the Role rows, these convert existing
    # members.
    backfill_org_admin_grants()
    backfill_caseworker_grants()
    backfill_shelter_grants()
    backfill_global_role_members()
    # Drop phantom Permission/ContentType rows superseded by real-model binding
    # (reports.view_reports) once roles/backfills have converged onto the real
    # rows.  Idempotent — a no-op on DBs that never synthesized them.
    retire_superseded_phantom_permissions()


class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "accounts"

    def ready(self) -> None:
        from post_office.settings import get_celery_enabled
        from post_office.signals import email_queued

        from .models import User
        from .signals import (
            mirror_group_membership_grants,
            setup_local_dev_data,
            sync_all_org_permission_groups,
        )
        from .tasks import queued_mail_handler

        if get_celery_enabled():
            email_queued.receivers.clear()
            email_queued.connect(queued_mail_handler)

        post_migrate.connect(_seed_on_migrate, sender=self)

        # The transition invariant (role-backed membership ⇔ Grant) is enforced
        # at the m2m edge so every writer keeps it (ADR 0001 §4 phase 2).
        m2m_changed.connect(
            mirror_group_membership_grants,
            sender=User.groups.through,
            dispatch_uid="mirror_group_membership_grants",
        )

        # Connect with sender=self so handlers fire exactly once (not per-app).
        # dispatch_uid prevents duplicate registration if ready() is re-called.
        post_migrate.connect(
            setup_local_dev_data,
            sender=self,
            dispatch_uid="setup_local_dev_data",
        )
        post_migrate.connect(
            sync_all_org_permission_groups,
            sender=self,
            dispatch_uid="sync_all_org_permission_groups",
        )

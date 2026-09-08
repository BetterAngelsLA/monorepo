from django.apps import AppConfig
from django.db.models.signals import m2m_changed, post_migrate


def _seed_on_migrate(sender: AppConfig, **kwargs: object) -> None:
    from accounts.seed import seed_permission_templates
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

    # Prime the object-grants switch lookup so the orphan-cleanup handler's
    # first fire after a deploy is a cache hit (reads state only; never
    # creates a Switch row).  Without this, the first ClientProfile delete in a
    # fresh process pays one extra query for the cold waffle lookup.
    from common.permissions.object_grants import object_grants_enabled

    object_grants_enabled()


class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "accounts"

    def ready(self) -> None:
        from django.db.models.signals import post_delete
        from post_office.settings import get_celery_enabled
        from post_office.signals import email_queued

        from .models import User
        from .signals import (
            cleanup_orphan_object_grants,
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

        # Object-grant orphans (finding F3): wire the cleanup to each candidate
        # model so a deleted row never leaves dangling grants.  The candidates
        # are switch-independent (the handler itself is runtime-gated), so
        # cleanup stays connected when the object_grants_enabled switch is
        # flipped on after startup.
        from common.permissions.object_grants import object_grantable_models

        for model in object_grantable_models():
            post_delete.connect(
                cleanup_orphan_object_grants,
                sender=model,
                dispatch_uid=f"cleanup_orphan_object_grants_{model._meta.label_lower}",
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

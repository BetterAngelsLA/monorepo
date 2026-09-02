from django.apps import AppConfig
from django.db.models.signals import post_migrate


def _seed_on_migrate(sender: AppConfig, **kwargs: object) -> None:
    from accounts.seed import seed_permission_templates
    from accounts.services import (
        backfill_global_role_members,
        backfill_org_admin_grants,
        backfill_shelter_grants,
        sync_roles,
    )

    seed_permission_templates()
    sync_roles()
    # Org-admin conversion (§5.3) must run before reconcile retires the legacy
    # rows: sync_roles creates the Role rows, this converts existing members,
    # then sync_all_org_permission_groups (connected after) reconciles and deletes.
    backfill_org_admin_grants()
    backfill_shelter_grants()
    backfill_global_role_members()


class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "accounts"

    def ready(self) -> None:
        from django.db.models.signals import post_delete
        from post_office.settings import get_celery_enabled
        from post_office.signals import email_queued

        from .signals import (
            cleanup_orphan_object_grants,
            setup_local_dev_data,
            sync_all_org_permission_groups,
        )
        from .tasks import queued_mail_handler

        if get_celery_enabled():
            email_queued.receivers.clear()
            email_queued.connect(queued_mail_handler)

        post_migrate.connect(_seed_on_migrate, sender=self)

        # Object-grant orphans (finding F3): wire the cleanup to each
        # whitelisted model so a deleted row never leaves dangling grants.
        from common.permissions.object_grants import object_grant_whitelist

        for model in object_grant_whitelist():
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

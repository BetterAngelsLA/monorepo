from django.apps import AppConfig
from django.db.models.signals import post_migrate


def _seed_on_migrate(sender: AppConfig, **kwargs: object) -> None:
    from accounts.seed import seed_permission_templates

    seed_permission_templates()


class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "accounts"

    def ready(self) -> None:
        from post_office.settings import get_celery_enabled
        from post_office.signals import email_queued

        from .signals import setup_local_dev_data, sync_all_org_permission_groups
        from .tasks import queued_mail_handler

        if get_celery_enabled():
            email_queued.receivers.clear()
            email_queued.connect(queued_mail_handler)

        post_migrate.connect(_seed_on_migrate, sender=self)

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

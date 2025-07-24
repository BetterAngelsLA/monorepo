from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "accounts"

    def ready(self) -> None:
        from post_office.settings import get_celery_enabled
        from post_office.signals import email_queued

        from . import signals  # noqa: F401
        from .tasks import queued_mail_handler

        if get_celery_enabled():
            email_queued.receivers.clear()
            email_queued.connect(queued_mail_handler)

from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "accounts"

    def ready(self) -> None:
        from post_office.signals import email_queued
        from post_office.tasks import queued_mail_handler

        from . import signals  # noqa: F401
        from .tasks import queued_mail_handler as custom_queued_mail_handler

        email_queued.disconnect(queued_mail_handler)
        email_queued.connect(custom_queued_mail_handler)

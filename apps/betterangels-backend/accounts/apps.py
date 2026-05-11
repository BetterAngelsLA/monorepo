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

        self._register_default_org_types()

    def _register_default_org_types(self) -> None:
        from accounts.enums import OrgType
        from accounts.groups import GroupTemplateNames
        from accounts.registry import OrgTypeConfig, register_org_type

        register_org_type(
            OrgType.OUTREACH,
            OrgTypeConfig(
                templates=[
                    GroupTemplateNames.CASEWORKER,
                    GroupTemplateNames.ORG_ADMIN,
                    GroupTemplateNames.ORG_SUPERUSER,
                ],
                member_role=GroupTemplateNames.CASEWORKER,
                invite_templates={
                    "html": "account/email/email_invite_organization.html",
                    "txt": "account/messages/email_invite_organization.txt",
                },
            ),
        )

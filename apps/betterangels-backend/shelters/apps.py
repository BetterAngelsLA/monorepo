from django.apps import AppConfig


class SheltersConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "shelters"

    def ready(self) -> None:
        from accounts.groups import GroupTemplateNames
        from accounts.org_type_registry import register_invite_template, register_org_type

        from .groups import SHELTER_OPERATOR

        register_org_type(
            "shelter",
            label="Shelter",
            templates=[SHELTER_OPERATOR, GroupTemplateNames.ORG_ADMIN, GroupTemplateNames.ORG_SUPERUSER],
            default_role=SHELTER_OPERATOR,
        )
        register_invite_template(
            SHELTER_OPERATOR,
            html="account/email/shelter_operator_invite.html",
            txt="account/messages/shelter_operator_invite.txt",
        )

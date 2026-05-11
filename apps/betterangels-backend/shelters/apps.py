from django.apps import AppConfig


class SheltersConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "shelters"

    def ready(self) -> None:
        from accounts.enums import OrgType
        from accounts.groups import GroupTemplateNames
        from accounts.registry import OrgTypeConfig, register_org_type

        register_org_type(
            OrgType.SHELTER,
            OrgTypeConfig(
                templates=[
                    GroupTemplateNames.SHELTER_OPERATOR,
                    GroupTemplateNames.ORG_ADMIN,
                    GroupTemplateNames.ORG_SUPERUSER,
                ],
                member_role=GroupTemplateNames.SHELTER_OPERATOR,
                invite_templates={
                    "html": "account/email/shelter_operator_invite.html",
                    "txt": "account/messages/shelter_operator_invite.txt",
                },
            ),
        )

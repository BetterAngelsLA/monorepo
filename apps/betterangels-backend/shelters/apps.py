from accounts.groups import ORG_ADMIN, ORG_SUPERUSER
from django.apps import AppConfig


class SheltersConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "shelters"

    def ready(self) -> None:
        from accounts.org_type_registry import OrgTypePreset, OrgTypeRegistry
        from shelters.groups import SHELTER_OPERATOR

        from . import signals  # noqa: F401

        OrgTypeRegistry.get().register(
            OrgTypePreset(
                name="shelter",
                label="Shelter",
                permission_templates=(SHELTER_OPERATOR, ORG_ADMIN, ORG_SUPERUSER),
                invite_body_html="shelters/email/invite_shelter_operator.html",
                invite_body_txt="shelters/messages/invite_shelter_operator.txt",
            )
        )

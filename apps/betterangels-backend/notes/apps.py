from django.apps import AppConfig


class NotesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "notes"

    def ready(self) -> None:
        from accounts.groups import GroupTemplateNames
        from accounts.org_type_registry import register_org_type

        from .groups import CASEWORKER

        register_org_type(
            "outreach",
            label="Outreach",
            templates=[CASEWORKER, GroupTemplateNames.ORG_ADMIN, GroupTemplateNames.ORG_SUPERUSER],
            member_role=CASEWORKER,
        )

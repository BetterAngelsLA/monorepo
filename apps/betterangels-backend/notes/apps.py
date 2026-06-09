from django.apps import AppConfig


class NotesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "notes"

    def ready(self) -> None:
        from accounts.groups import ORG_ADMIN, ORG_SUPERUSER
        from accounts.org_type_registry import OrgTypePreset, OrgTypeRegistry
        from notes.groups import CASEWORKER

        OrgTypeRegistry.get().register(
            OrgTypePreset(
                name="outreach",
                label="Outreach",
                permission_templates=(CASEWORKER, ORG_ADMIN, ORG_SUPERUSER),
            )
        )

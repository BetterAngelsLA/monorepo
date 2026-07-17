from django.apps import AppConfig
from django.db.models.signals import post_migrate


def _seed_on_migrate(sender: AppConfig, **kwargs: object) -> None:
    from notes.seed import seed_organization_services

    seed_organization_services()


class NotesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "notes"

    def ready(self) -> None:
        post_migrate.connect(_seed_on_migrate, sender=self)


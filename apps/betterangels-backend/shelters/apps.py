from django.apps import AppConfig
from django.db.models.signals import post_migrate


def _seed_on_migrate(sender: AppConfig, **kwargs: object) -> None:
    from shelters.seed import seed_shelter_lookups

    seed_shelter_lookups()


class SheltersConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "shelters"

    def ready(self) -> None:
        from . import signals  # noqa: F401

        post_migrate.connect(_seed_on_migrate, sender=self)

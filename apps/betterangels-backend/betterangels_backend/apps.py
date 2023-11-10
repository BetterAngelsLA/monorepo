from django.apps import AppConfig


class BetterAngelsConfig(AppConfig):
    name: str = 'betterangels_backend'

    def ready(self) -> None:
        from . import signals  # noqa: F401

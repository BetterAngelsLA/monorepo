from django.apps import AppConfig


class BetterAngelsConfig(AppConfig):
    name: str = 'betterangels_backend'

    def ready(self) -> None:
        from betterangels_backend import signals  # noqa: F401

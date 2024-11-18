from django.apps import AppConfig
from waffle.models import Flag

def add_show_delete_modal_flag():
    flag, _ = Flag.objects.get_or_create(name="show_delete_modal", defaults={"everyone": True})
    if not flag.everyone:
        flag.everyone = True
        flag.save()


class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "accounts"

    def ready(self) -> None:
        from . import signals  # noqa: F401

        add_show_delete_modal_flag()

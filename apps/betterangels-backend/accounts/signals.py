from typing import Any

from django.conf import settings
from django.db.models.signals import post_migrate
from django.dispatch import receiver

from .models import User


@receiver(post_migrate)
def create_superuser(sender: Any, **kwargs: Any) -> None:
    if settings.IS_LOCAL_DEV and not User.objects.filter(username="admin").exists():
        User.objects.create_superuser(
            username="admin", email="admin@ba.la", password="admin"
        )

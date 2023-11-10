from typing import Any

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models.signals import post_migrate
from django.dispatch import receiver


@receiver(post_migrate)
def create_superuser(sender: Any, **kwargs: Any) -> None:
    User = get_user_model()
    if settings.IS_LOCAL_DEV:
        if not User.objects.filter(username="admin").exists():
            User.objects.create_superuser(
                username="admin", email="admin@ba.la", password="admin"
            )

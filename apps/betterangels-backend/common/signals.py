from typing import Any

from django.conf import settings
from django.db.models.signals import post_migrate
from django.dispatch import receiver


@receiver(post_migrate)
def enable_imgproxy_switch(sender: Any, **kwargs: Any) -> None:
    """Seed the imgproxy waffle switch as active in local dev."""
    if not settings.IS_LOCAL_DEV:
        return

    from common.imgproxy import IMGPROXY_SWITCH
    from waffle.models import Switch

    Switch.objects.get_or_create(name=IMGPROXY_SWITCH, defaults={"active": True})

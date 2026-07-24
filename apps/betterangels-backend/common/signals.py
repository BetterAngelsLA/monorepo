import waffle
from django.conf import settings

# Connected via CommonConfig.ready() with sender=self — fires once, not per-app.


def enable_imgproxy_switch(sender: object, **kwargs: object) -> None:
    """Seed the imgproxy waffle switch as active in local dev and prime cache."""
    if not settings.IS_LOCAL_DEV:
        return

    from common.imgproxy import IMGPROXY_SWITCH
    from waffle.models import Switch

    Switch.objects.get_or_create(name=IMGPROXY_SWITCH, defaults={"active": True})
    waffle.switch_is_active(IMGPROXY_SWITCH)  # prime the in-memory cache

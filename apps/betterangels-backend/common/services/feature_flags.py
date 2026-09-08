"""Feature-flag helpers backed by django-waffle."""

from typing import cast

from strawberry.types import Info
from waffle import get_waffle_flag_model


def flag_is_active(info: Info, name: str) -> bool:
    """Return whether the *name* waffle flag is active for the current request.

    Results are memoized on the request object so repeated checks (e.g. once per
    row) avoid re-querying the flag model. A missing flag is treated as inactive
    so nothing breaks before the flag is created in the admin.
    """
    request = info.context["request"]
    cache = getattr(request, "_waffle_flags", None)
    if cache is None:
        cache = {}
        request._waffle_flags = cache
    if name not in cache:
        flag = get_waffle_flag_model().objects.filter(name=name).first()
        cache[name] = bool(flag.is_active(request)) if flag is not None else False
    return cast(bool, cache[name])

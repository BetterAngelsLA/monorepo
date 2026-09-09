"""Feature-flag helpers backed by django-waffle."""

from typing import cast

from strawberry.types import Info
from waffle import flag_is_active as waffle_flag_is_active


def flag_is_active(info: Info, name: str) -> bool:
    """Return whether the *name* waffle flag is active for the current request.

    Results are memoized on the request object so repeated checks (e.g. once per
    row) avoid re-evaluating the flag. Evaluation is delegated to
    :func:`waffle.flag_is_active`, which handles waffle's own caching,
    ``WAFFLE_FLAG_DEFAULT`` for missing flags, and per-user/group semantics.
    """
    request = info.context["request"]
    cache = getattr(request, "_waffle_flags", None)
    if cache is None:
        cache = {}
        request._waffle_flags = cache
    if name not in cache:
        cache[name] = bool(waffle_flag_is_active(request, name))
    return cast(bool, cache[name])

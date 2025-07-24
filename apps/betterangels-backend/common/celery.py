import functools
from typing import Any, Callable, TypeVar, cast

from celery import Task
from celery.exceptions import Ignore
from django.core.cache import caches

F = TypeVar("F", bound=Callable[..., Any])


def single_instance(
    *,
    cache_alias: str = "default",
    lock_key: str | None = None,
    lock_ttl: int = 3600,
    retry_delay: int = 60,
) -> Callable[[F], F]:
    cache = caches[cache_alias]

    def decorator(func: F) -> F:
        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            # assume first arg is always the Task instance
            self, *rest = args
            key = lock_key or f"celery-lock:{self.name}"
            if not cache.add(key, "1", timeout=lock_ttl):
                self.apply_async(args=rest, kwargs=kwargs, countdown=retry_delay)
                raise Ignore()

            try:
                return func(*args, **kwargs)
            finally:
                cache.delete(key)

        return cast(F, wrapper)

    return decorator

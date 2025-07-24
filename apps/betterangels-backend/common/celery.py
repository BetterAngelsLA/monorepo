import functools
from typing import Callable, Concatenate, ParamSpec, TypeVar

from celery import Task
from celery.exceptions import Ignore
from django.core.cache import caches

P = ParamSpec("P")
R = TypeVar("R")


def single_instance(
    *,
    cache_alias: str = "default",
    lock_key: str | None = None,
    lock_ttl: int = 3600,
    retry_delay: int = 60,
) -> Callable[[Callable[Concatenate[Task, P], R]], Callable[Concatenate[Task, P], R]]:
    """Decorator that guarantees only one running instance of a Celery task."""

    cache = caches[cache_alias]

    def decorator(func: Callable[Concatenate[Task, P], R]) -> Callable[Concatenate[Task, P], R]:
        @functools.wraps(func)
        def wrapper(self: Task, *args: P.args, **kwargs: P.kwargs) -> R:  # <- R only
            key = lock_key or f"celery-lock:{self.name}"
            acquired = bool(cache.add(key, "1", timeout=lock_ttl))

            if not acquired:
                # Another instance is running — re‑queue and skip
                self.apply_async(args=args, kwargs=kwargs, countdown=retry_delay)
                raise Ignore()  # raises → never returns

            try:
                return func(self, *args, **kwargs)
            finally:
                cache.delete(key)

        return wrapper

    return decorator

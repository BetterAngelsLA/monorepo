import os
from datetime import date, datetime, time, timedelta, tzinfo
from typing import Any, Iterable, Set, TypeVar

import requests
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.db.models import Field, Model, QuerySet
from strawberry.utils.str_converters import to_camel_case, to_snake_case

_M = TypeVar("_M", bound=Model)


def can_match(*, field: Field, value: Any) -> bool:
    """Whether *value* is one the column behind *field* could hold."""
    try:
        field.get_prep_value(value)
    except ValueError, TypeError, ValidationError:
        return False

    return True


def matchable_values(*, field: Field, values: Iterable[Any]) -> list[Any]:
    """Drop the values *field* cannot hold, keeping the rest in order."""
    return [value for value in values if can_match(field=field, value=value)]


def get_or_none(queryset: QuerySet[_M], pk: Any) -> _M | None:
    """Return the row *pk* names, or ``None`` -- including when *pk* cannot match."""
    if not can_match(field=queryset.model._meta.pk, value=pk):
        return None

    return queryset.filter(pk=pk).first()


def get_by_pk_or_not_found(queryset: QuerySet[_M], pk: int | str) -> _M:
    """Get an object by primary key, raising ObjectDoesNotExist on failure.

    Uses ``queryset.model.__name__`` to build a descriptive error message.
    """
    obj = get_or_none(queryset, pk)

    if obj is None:
        raise ObjectDoesNotExist(f"{queryset.model.__name__} matching ID {pk} could not be found.")

    return obj


def get_fargate_task_ips() -> Set[str]:
    """Fetch the IP addresses of the current AWS Fargate task.

    Uses the ECS container metadata endpoint (v4) to discover all IPv4
    addresses assigned to the task's containers.  Returns an empty set
    when not running on ECS.
    """
    metadata_uri_env = "ECS_CONTAINER_METADATA_URI_V4"
    ips: Set[str] = set()
    if metadata_uri_env in os.environ:
        metadata_uri = os.environ[metadata_uri_env]
        response = requests.get(f"{metadata_uri}/task")
        if response.ok:
            task_data = response.json()
            for container in task_data.get("Containers", []):
                for network in container.get("Networks", []):
                    ips.update(network.get("IPv4Addresses", []))
    return ips


def dict_keys_to_camel(d: dict[str, Any]) -> dict[str, Any]:
    """Return a new dict with camelCase keys."""
    return {to_camel_case(k): v for k, v in d.items()}


def dict_keys_to_snake(d: dict[str, Any]) -> dict[str, Any]:
    """Return a new dict with snake_case keys."""
    return {to_snake_case(k): v for k, v in d.items()}


# ── Calendar ranges ───────────────────────────────────────────────────────────


def day_end(day: date, tz: tzinfo) -> datetime:
    """Midnight at the start of the day *after* ``day``, in ``tz``.

    The exclusive upper bound for events that fall on ``day``. See
    :func:`aware_range` for why the bound is exclusive.
    """
    return datetime.combine(day + timedelta(days=1), time.min, tzinfo=tz)


def aware_range(start_date: date, end_date: date, tz: tzinfo) -> tuple[datetime, datetime]:
    """Two **inclusive** calendar dates → a half-open ``[start, end)`` pair of instants.

    The one form of this conversion for every report that needs it — ``reports``,
    ``regions`` and ``shelters``. Centralised because getting it subtly wrong is
    invisible: an off-by-one-day bound still returns rows, just the wrong ones, and the
    report's totals stop reconciling against its buckets.

    Three decisions worth keeping in one place:

    * **Half-open on instants**, not ``field__date``. A ``__date`` lookup wraps the column
      in a cast and loses its index; ``gte``/``lt`` does not.
    * **``tzinfo=tz`` at construction**, not a separate ``make_aware``. For a ``ZoneInfo``
      the two are identical (``make_aware`` is ``value.replace(tzinfo=…)``), so this is the
      shorter spelling of the same instant — but it is *one* call, so there is no window in
      which a naive datetime exists.
    * **The calendar is the caller's**, passed in rather than read from the active
      timezone. The range and every bucket computed beneath it must agree on which day a
      row falls in, and ``TruncDate`` consults the activated zone by default — so the
      caller decides once and passes the same ``tz`` to both.
    """
    return datetime.combine(start_date, time.min, tzinfo=tz), day_end(end_date, tz)

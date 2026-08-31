import os
from typing import Any, Iterable, Set, TypeVar

import requests
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.db.models import Field, Model, QuerySet
from strawberry.utils.str_converters import to_camel_case, to_snake_case

_M = TypeVar("_M", bound=Model)


def can_match(*, field: Field, value: Any) -> bool:
    """Whether *value* is one the column behind *field* could hold.

    A GraphQL ``ID`` accepts any string, so a value can reach a lookup that the
    column cannot store -- and Django raises from inside the query rather than
    returning nothing. A value it cannot store names no row, which is what every
    caller wants to know.

    ``get_prep_value`` rather than ``to_python`` or ``clean``: it is the call
    ``Lookup.get_prep_lookup`` makes, so this rejects exactly what the lookup
    would have raised on. The cost is that it has no single exception contract --
    an integer column raises ``ValueError``/``TypeError`` and a UUID column
    raises ``ValidationError`` -- where ``to_python`` would raise only the last.
    """
    try:
        field.get_prep_value(value)
    except ValueError, TypeError, ValidationError:
        return False

    return True


def matchable_values(*, field: Field, values: Iterable[Any]) -> list[Any]:
    """Drop the values *field* cannot hold, keeping the rest in order.

    An empty result is not the same as no filter: Django renders ``__in []`` as
    matching nothing, which is what a list of entirely unmatchable values should
    do.
    """
    return [value for value in values if can_match(field=field, value=value)]


def get_by_pk_or_not_found(queryset: QuerySet[_M], pk: int | str) -> _M:
    """Get an object by primary key, raising ObjectDoesNotExist on failure.

    Uses ``queryset.model.__name__`` to build a descriptive error message.

    *pk* may come from a GraphQL ``ID``, which accepts any string. One the
    primary key cannot hold names no row, so it is reported as not found rather
    than allowed to raise from inside the query.
    """
    obj = queryset.filter(pk=pk).first() if can_match(field=queryset.model._meta.pk, value=pk) else None

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

import os
from typing import Any, Set, TypeVar

import requests
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Model, QuerySet
from strawberry.utils.str_converters import to_camel_case, to_snake_case

_M = TypeVar("_M", bound=Model)


def get_by_pk_or_not_found(queryset: QuerySet[_M], pk: int | str) -> _M:
    """Get an object by primary key, raising ObjectDoesNotExist on failure.

    Uses ``queryset.model.__name__`` to build a descriptive error message.
    """
    obj = queryset.filter(pk=pk).first()
    if obj is None:
        raise ObjectDoesNotExist(
            f"{queryset.model.__name__} matching ID {pk} could not be found."
        )
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

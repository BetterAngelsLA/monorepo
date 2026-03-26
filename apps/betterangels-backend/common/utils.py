# apps/betterangels-backend/common/utils.py

import os
from typing import Any, Set

import requests
from strawberry.utils.str_converters import to_camel_case, to_snake_case


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

import os
from typing import Set

import requests
from django.apps import AppConfig
from django.conf import settings


class CommonConfig(AppConfig):
    name = "common"

    def ready(self) -> None:
        """
        Adjusts Django ALLOWED_HOSTS for AWS Fargate tasks by utilizing
        the task metadata endpoint to fetch the task's IP addresses and
        add them to ALLOWED_HOSTS.
        """

        def get_fargate_task_ips() -> Set:
            metadata_uri_env = "ECS_CONTAINER_METADATA_URI_V4"
            ips = set()  # Use a set to avoid duplicates
            if metadata_uri_env in os.environ:
                metadata_uri = os.environ[metadata_uri_env]
                response = requests.get(f"{metadata_uri}/task")
                if response.ok:
                    task_data = response.json()
                    for container in task_data.get("Containers", []):
                        for network in container.get("Networks", []):
                            ips.update(network.get("IPv4Addresses", []))
            return ips

        task_ips = get_fargate_task_ips()
        if task_ips:
            settings.ALLOWED_HOSTS.extend(task_ips)

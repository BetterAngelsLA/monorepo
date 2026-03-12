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
        self._register_imgproxy_image_type()

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

    @staticmethod
    def _register_imgproxy_image_type() -> None:
        """Override strawberry-django's default ``DjangoImageType`` so every
        ``ImageField`` output type uses our custom type with imgproxy support.
        Also patch field resolution so ``ImageField`` auto fields are converted
        via ``BaImageType.from_field_file``, enabling ``profile_photo: auto``
        without a custom resolver.
        """
        import inspect

        from django.db.models.fields import files
        from strawberry_django.fields.field import StrawberryDjangoField
        from strawberry_django.fields.types import field_type_map

        from common.graphql.types import BaImageType

        field_type_map[files.ImageField] = BaImageType

        _original_get_result = StrawberryDjangoField.get_result

        def _convert_image_field_result(field: StrawberryDjangoField, value: object) -> object:
            """If this field is an ImageField and value is a FieldFile, wrap as BaImageType."""
            if value is None:
                return None
            if not isinstance(value, (files.FieldFile, files.ImageFieldFile)):
                return value
            origin = getattr(field, "origin_django_type", None)
            if origin is None:
                return value
            model = getattr(origin, "model", None)
            if model is None:
                return value
            try:
                django_name = field.django_name or field.python_name
                model_field = model._meta.get_field(django_name)
            except Exception:
                return value
            if not isinstance(model_field, files.ImageField):
                return value
            return BaImageType.from_field_file(value)

        def get_result(
            self: StrawberryDjangoField,
            source: object,
            info: object,
            args: list,
            kwargs: dict,
        ) -> object:
            result = _original_get_result(self, source, info, args, kwargs)
            if inspect.isawaitable(result):
                async def wrap() -> object:
                    resolved = await result
                    return _convert_image_field_result(self, resolved)
                return wrap()
            return _convert_image_field_result(self, result)

        StrawberryDjangoField.get_result = get_result  # type: ignore[method-assign]

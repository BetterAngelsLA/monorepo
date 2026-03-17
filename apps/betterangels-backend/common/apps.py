
from common.utils import get_fargate_task_ips
from django.apps import AppConfig
from django.conf import settings
from django.db.models.fields import files
from strawberry_django.fields.types import field_type_map


class CommonConfig(AppConfig):
    name = "common"

    def ready(self) -> None:
        self._register_imgproxy_image_type()
        self._configure_allowed_hosts()

    @staticmethod
    def _configure_allowed_hosts() -> None:
        """Add Fargate task IPs to ALLOWED_HOSTS when running on ECS."""
        task_ips = get_fargate_task_ips()
        if task_ips:
            settings.ALLOWED_HOSTS.extend(task_ips)

    @staticmethod
    def _register_imgproxy_image_type() -> None:
        """Override strawberry-django's default ``DjangoImageType`` so every
        ``ImageField`` output type uses our custom type with imgproxy support.
        """
        from common.graphql.types import TransformableImageType

        field_type_map[files.ImageField] = TransformableImageType


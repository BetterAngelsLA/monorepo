from common.utils import get_fargate_task_ips
from django.apps import AppConfig
from django.conf import settings
from django.db.models.fields import files
from django.db.models.signals import post_migrate
from strawberry_django.fields.types import field_type_map


class CommonConfig(AppConfig):
    name = "common"

    def ready(self) -> None:
        from common.permissions import checks as _permission_checks  # noqa: F401

        from .signals import enable_imgproxy_switch

        self._register_imgproxy_image_type()
        self._configure_allowed_hosts()
        self._connect_object_grant_cleanup()

        # Connect with sender=self so handler fires exactly once.
        post_migrate.connect(enable_imgproxy_switch, sender=self)

    @staticmethod
    def _connect_object_grant_cleanup() -> None:
        """Drop object grants when their row is deleted (ADR 0001 §2.5, finding F3).

        ``Grant.scope_object`` is a generic pointer, so no foreign key cascades on
        it: a grant would outlive the row it names and could later point at a
        reused id.  One receiver per whitelisted model — Django consults
        ``post_delete.sender_receivers_cache`` for an instance delete, so a
        sender-less receiver is never reached.  The whitelist is also the complete
        set of models that can carry an object grant (``Grant.clean`` /
        ``permissions.E003``), so it defines the receivers exactly.
        """
        from common.permissions.signals import connect_object_grant_cleanup

        connect_object_grant_cleanup()

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

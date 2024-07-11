from typing import Optional

from django.db.models.query import QuerySet

from .enums import AttachmentType


class AttachmentQuerySet(QuerySet):
    def hero_image(self) -> "AttachmentQuerySet":
        return self.filter(attachment_type=AttachmentType.IMAGE).filter(namespace="hero_image")

    def images(self) -> "AttachmentQuerySet":
        return self.filter(attachment_type=AttachmentType.IMAGE)

    def videos(self) -> "AttachmentQuerySet":
        return self.filter(attachment_type=AttachmentType.VIDEO)

    def for_namespace(self, namespace: Optional[str]) -> "AttachmentQuerySet":
        return self.filter(namespace=namespace)

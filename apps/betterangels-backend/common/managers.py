from typing import Optional

from django.db.models.query import QuerySet

from .enums import AttachmentType


class AttachmentQuerySet(QuerySet):
    def for_namespace(self, namespace: Optional[str]) -> "AttachmentQuerySet":
        return self.filter(namespace=namespace)

    def hero_image(self) -> "AttachmentQuerySet":
        return self.filter(attachment_type=AttachmentType.IMAGE).for_namespace("hero_image")

    def images(self) -> "AttachmentQuerySet":
        return self.filter(attachment_type=AttachmentType.IMAGE)

    def videos(self) -> "AttachmentQuerySet":
        return self.filter(attachment_type=AttachmentType.VIDEO)

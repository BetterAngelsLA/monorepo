from typing import TYPE_CHECKING, Any, Optional, cast

from django.core.exceptions import ValidationError
from django.db import models
from django.db.models.query import QuerySet
from django.http import HttpRequest

from .enums import AttachmentType

if TYPE_CHECKING:
    from .models import Attachment


class AttachmentQuerySet(QuerySet["Attachment"]):
    def hero_image(self) -> "AttachmentQuerySet":
        return self.filter(attachment_type=AttachmentType.IMAGE).filter(namespace="hero_image")

    def images(self) -> "AttachmentQuerySet":
        return self.filter(attachment_type=AttachmentType.IMAGE)

    def videos(self) -> "AttachmentQuerySet":
        return self.filter(attachment_type=AttachmentType.VIDEO)

    def for_namespace(self, namespace: str) -> "AttachmentQuerySet":
        return self.filter(namespace=namespace)


class BaseAttachmentManager(models.Manager["Attachment"]):
    def get_queryset(self, request: Optional[HttpRequest] = None) -> AttachmentQuerySet:
        queryset = super().get_queryset()

        # Placeholder for future filters based off requests
        if request:
            pass

        return cast(AttachmentQuerySet, queryset)

    def for_namespace(self, namespace: str) -> AttachmentQuerySet:
        return self.get_queryset().for_namespace(namespace)

    def _create_with_type(self, attachment_type: "AttachmentType", **kwargs: Any) -> "Attachment":
        kwargs["attachment_type"] = attachment_type
        return super().create(**kwargs)


class ImageAttachmentManager(BaseAttachmentManager):
    def get_queryset(self, request: Optional[HttpRequest] = None) -> AttachmentQuerySet:
        return super().get_queryset(request).images()

    def create(self, **kwargs: Any) -> "Attachment":
        return self._create_with_type(AttachmentType.IMAGE, **kwargs)


class VideoAttachmentManager(BaseAttachmentManager):
    def get_queryset(self, request: Optional[HttpRequest] = None) -> AttachmentQuerySet:
        return super().get_queryset(request).videos()

    def create(self, **kwargs: Any) -> "Attachment":
        return self._create_with_type(AttachmentType.VIDEO, **kwargs)


class HeroImageManager(BaseAttachmentManager):
    def get_queryset(self, request: Optional[HttpRequest] = None) -> AttachmentQuerySet:
        return super().get_queryset(request).images().filter(namespace="hero_image")

    def create(self, **kwargs: Any) -> "Attachment":
        content_type = kwargs.get("content_type")
        object_id = kwargs.get("object_id")

        if self.filter(content_type=content_type, object_id=object_id).exists():
            raise ValidationError("A hero image already exists for this content object.")

        kwargs["namespace"] = "hero_image"
        return self._create_with_type(AttachmentType.IMAGE, **kwargs)

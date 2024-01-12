from accounts.models import User
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.db.models import QuerySet
from django.utils.translation import gettext_lazy as _
from imagekit.models import ProcessedImageField
from imagekit.processors import ResizeToFill


class Note(models.Model):
    id: int
    title = models.CharField(max_length=100)
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notes")

    objects = models.Manager()

    def __str__(self) -> str:
        return self.body[:50]


class AttachmentManager(models.Manager):
    def get_queryset(self) -> QuerySet:
        return super().get_queryset()

    def photo_attachments(self) -> QuerySet:
        return self.get_queryset().filter(
            attachment_type=Attachment.AttachmentType.PHOTO
        )

    def audio_attachments(self) -> QuerySet:
        return self.get_queryset().filter(
            attachment_type=Attachment.AttachmentType.AUDIO
        )


# Attachment model with generic relation
class Attachment(models.Model):
    class AttachmentType(models.TextChoices):
        PHOTO = "photo", _("Photo")
        AUDIO = "audio", _("Audio")

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")

    attachment_type = models.CharField(
        max_length=5,
        choices=AttachmentType.choices,
        default=AttachmentType.PHOTO,
        db_index=True,
    )
    file = models.FileField(upload_to="attachments/")
    image = ProcessedImageField(
        upload_to="photos/",
        processors=[ResizeToFill(100, 50)],
        format="JPEG",
        options={"quality": 60},
        null=True,
        blank=True,
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    objects = AttachmentManager()

    # def __str__(self):
    #     return f"Attachment for {self.content_object} ({self.get_attachment_type_display()})" # noqa: B950
    def is_photo(self) -> bool:
        return self.attachment_type == self.AttachmentType.PHOTO

    def is_audio(self) -> bool:
        return self.attachment_type == self.AttachmentType.AUDIO

from accounts.models import User
from django.db import models
from imagekit.models import ProcessedImageField
from imagekit.processors import ResizeToFill


class BaseAttachment(models.Model):
    file = models.FileField(upload_to="attachments/")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    description = models.TextField(blank=True)

    class Meta:
        abstract = True


class AudioAttachment(BaseAttachment):
    bitrate = models.IntegerField()
    duration = models.DurationField()
    # Additional fields specific to audio, like sample rate, etc.


class DocumentAttachment(BaseAttachment):
    # Additional fields specific to PDFs, like author, version, etc.
    pass


class ImageAttachment(models.Model):
    file = ProcessedImageField(
        upload_to="attachments/images/thumbnails/",
        processors=[ResizeToFill(100, 50)],
        format="JPEG",
        options={"quality": 60},
    )
    # Other fields specific to images...


class VideoAttachment(BaseAttachment):
    duration = models.DurationField()
    resolution = models.CharField(max_length=50)
    # Additional fields specific to videos, like frame rate, etc.


class Note(models.Model):
    title = models.CharField(max_length=100)
    body = models.TextField()

    audio_attachments = models.ManyToManyField(AudioAttachment, related_name="notes")
    document_attachments = models.ManyToManyField(
        DocumentAttachment, related_name="notes"
    )
    image_attachments = models.ManyToManyField(ImageAttachment, related_name="notes")
    video_attachments = models.ManyToManyField(VideoAttachment, related_name="notes")

    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notes")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return self.body[:50]

from accounts.models import User
from django.db import models
from imagekit.models import ImageSpecField
from imagekit.processors import ResizeToFill

BASE_UPLOAD_TO = "attachments"


class BaseAttachment(models.Model):
    id = models.BigAutoField(primary_key=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    description = models.TextField(blank=True)

    class Meta:
        abstract = True


class AudioAttachment(BaseAttachment):
    # bitrate = models.IntegerField()
    # duration = models.DurationField()
    # # Additional fields specific to audio, like sample rate, etc.
    pass


class DocumentAttachment(BaseAttachment):
    file = models.FileField(upload_to=f"{BASE_UPLOAD_TO}/documents/")
    # author
    # Add other document-specific fields here


class ImageAttachment(BaseAttachment):
    file = models.FileField(upload_to=f"{BASE_UPLOAD_TO}/images/")
    thumbnail = ImageSpecField(
        source="avatar",
        processors=[ResizeToFill(100, 50)],
        format="JPEG",
        options={"quality": 60},
    )


class VideoAttachment(BaseAttachment):
    file = models.ImageField(upload_to=f"{BASE_UPLOAD_TO}/videos/")
    # duration = models.DurationField()
    # resolution = models.CharField(max_length=50)
    # Additional fields specific to videos, like frame rate, etc.
    pass


class Note(models.Model):
    id = models.BigAutoField(primary_key=True)
    title = models.CharField(max_length=100)
    body = models.TextField()

    audio_attachments = models.ManyToManyField(AudioAttachment, related_name="notes")
    document_attachments = models.ManyToManyField(
        DocumentAttachment, related_name="notes"
    )
    image_attachments = models.ManyToManyField(ImageAttachment, related_name="notes")
    video_attachments = models.ManyToManyField(VideoAttachment, related_name="notes")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notes")

    def __str__(self) -> str:
        return self.body[:50]

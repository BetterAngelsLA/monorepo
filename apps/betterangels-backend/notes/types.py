import strawberry_django
from accounts.types import UserType
from strawberry import auto

from . import models


@strawberry_django.type(models.Note)
class NoteType:
    id: auto
    title: auto
    body: auto
    created_at: auto
    created_by: UserType


@strawberry_django.input(models.Note)
class CreateNoteInput:
    title: auto
    body: auto


@strawberry_django.input(models.Note)
class UpdateNoteInput:
    id: auto
    title: auto
    body: auto


@strawberry_django.type(models.AudioAttachment)
class AudioAttachmentType:
    id: auto
    uploaded_at: auto
    description: auto


@strawberry_django.input(models.AudioAttachment)
class AudioAttachmentInput:
    # bitrate: Optional[int] = None
    # duration: Optional[float] = None  # Duration in seconds
    # Add other audio-specific fields here
    pass


@strawberry_django.type(models.DocumentAttachment)
class DocumentAttachmentType:
    id: auto
    uploaded_at: auto
    description: auto


@strawberry_django.input(models.DocumentAttachment)
class DocumentAttachmentInput:
    # author: Optional[str] = None
    # version: Optional[str] = None
    # Add other document-specific fields here
    pass


@strawberry_django.type(models.ImageAttachment)
class ImageAttachmentType:
    id: auto
    uploaded_at: auto
    description: auto


@strawberry_django.input(models.ImageAttachment)
class ImageAttachmentInput:
    # resolution: Optional[str] = None  # e.g., "1920x1080"
    # Add other image-specific fields here
    pass


@strawberry_django.type(models.VideoAttachment)
class VideoAttachmentType:
    id: auto
    uploaded_at: auto
    description: auto


@strawberry_django.input(models.VideoAttachment)
class VideoAttachmentInput:
    # duration: Optional[float] = None  # Duration in seconds
    # resolution: Optional[str] = None  # e.g., "1920x1080"
    # frame_rate: Optional[int] = None
    # Add other video-specific fields here
    pass

from django.db import models
from django.utils.translation import gettext_lazy as _


class FileType(models.TextChoices):
    IMAGE = "image", _("Image")
    DOCUMENT = "document", _("Document")
    AUDIO = "audio", _("Audio")
    VIDEO = "video", _("Video")
    UNKNOWN = "unknown", _("Unknown")

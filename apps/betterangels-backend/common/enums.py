from django.db import models
from django.utils.translation import gettext_lazy as _


class AttachmentType(models.TextChoices):
    IMAGE = "image", _("Image")
    DOCUMENT = "document", _("Document")
    AUDIO = "audio", _("Audio")
    VIDEO = "video", _("Video")
    UNKNOWN = "unknown", _("Unknown")


class ErrorMessageEnum(models.TextChoices):
    EMAIL_IN_USE = "email_in_use", _("Email is already in use")
    HMIS_ID_IN_USE = "hmis_id_in_use", _("HMIS ID is already in use")
    INVALID_PHONE_NUMBER = "invalid_phone_number", _("Invalid phone number")
    NO_NAME_PROVIDED = "no_name_provided", _("No name provided")

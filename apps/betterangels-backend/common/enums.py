from django.db import models
from django.utils.translation import gettext_lazy as _


class AttachmentType(models.TextChoices):
    IMAGE = "image", _("Image")
    DOCUMENT = "document", _("Document")
    AUDIO = "audio", _("Audio")
    VIDEO = "video", _("Video")
    UNKNOWN = "unknown", _("Unknown")


class ErrorMessageEnum(models.TextChoices):
    CA_ID_INVALID = "ca_id_invalid", _("California ID invalid")
    CA_ID_IN_USE = "ca_id_in_us", _("California ID is already in use")
    EMAIL_INVALID = "email_invalid", _("Email invalid")
    EMAIL_IN_USE = "email_in_use", _("Email is already in use")
    HMIS_ID_IN_USE = "hmis_id_in_use", _("HMIS ID is already in use")
    HMIS_ID_NOT_PROVIDED = "hmis_id_not_provided", _("HMIS ID not provided")
    NAME_NOT_PROVIDED = "name_not_provided", _("Name not provided")
    PHONE_NUMBER_INVALID = "phone_number_invalid", _("Phone number invalid")

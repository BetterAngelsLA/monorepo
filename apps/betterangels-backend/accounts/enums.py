from django.db import models
from django.utils.translation import gettext_lazy as _


class GenderEnum(models.TextChoices):
    MALE = "male", _("Male")
    FEMALE = "female", _("Female")
    NONBINARY = "nonbinary", _("Non-binary")


class LanguageEnum(models.TextChoices):
    ENGLISH = "english", _("English")
    SPANISH = "spanish", _("Spanish")

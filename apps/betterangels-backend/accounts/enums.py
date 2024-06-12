import strawberry
from django.db import models
from django.utils.translation import gettext_lazy as _


class GenderEnum(models.TextChoices):
    MALE = "male", _("Male")
    FEMALE = "female", _("Female")
    NONBINARY = "nonbinary", _("Non-binary")


@strawberry.enum
class LanguageEnum(models.TextChoices):
    ARABIC = "arabic", _("Arabic")
    ARMENIAN = "armenian", _("Armenian")
    ENGLISH = "english", _("English")
    FARSI = "farsi", _("Farsi")
    INDONESIAN = "indonesian", _("Indonesian")
    JAPANESE = "japanese", _("Japanese")
    KHMER = "khmer", _("Khmer")
    KOREAN = "korean", _("Korean")
    RUSSIAN = "russian", _("Russian")
    SIMPLIFIED_CHINESE = "simplified_chinese", _("Simplified Chinese")
    SPANISH = "spanish", _("Spanish")
    TAGALOG = "tagalog", _("Tagalog")
    TRADITIONAL_CHINESE = "traditional_chinese", _("Traditional Chinese")
    VIETNAMESE = "vietnamese", _("Vietnamese")


class YesNoPreferNotToSayEnum(models.TextChoices):
    YES = "yes", _("Yes")
    NO = "no", _("No")
    PREFER_NOT_TO_SAY = "prefer_not_to_say", _("Prefer not to say")

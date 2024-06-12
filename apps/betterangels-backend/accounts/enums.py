import strawberry
from django.db import models
from django.utils.translation import gettext_lazy as _


class GenderEnum(models.TextChoices):
    MALE = "male", _("Male")
    FEMALE = "female", _("Female")
    NONBINARY = "nonbinary", _("Non-binary")


@strawberry.enum
class LanguageEnum(models.TextChoices):
    ENGLISH = "english", "English"
    RUSSIAN = "russian", "Russian"
    JAPANESE = "japanese", "Japanese"
    ARABIC = "arabic", "Arabic"
    PERSIAN = "persian", "Persian"
    ARMENIAN = "armenian", "Armenian"
    KOREAN = "korean", "Korean"
    VIETNAMESE = "vietnamese", "Vietnamese"
    TAGALOG = "tagalog", "Tagalog"
    CHINESE = "chinese", "Chinese"
    SPANISH = "spanish", "Spanish"


class YesNoPreferNotToSayEnum(models.TextChoices):
    YES = "yes", _("Yes")
    NO = "no", _("No")
    PREFER_NOT_TO_SAY = "prefer_not_to_say", _("Prefer not to say")

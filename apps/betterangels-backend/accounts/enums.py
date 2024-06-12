import strawberry
from django.db import models
from django.utils.translation import gettext_lazy as _


class GenderEnum(models.TextChoices):
    MALE = "male", _("Male")
    FEMALE = "female", _("Female")
    NONBINARY = "nonbinary", _("Non-binary")


@strawberry.enum
class LanguageEnum(models.TextChoices):
    ENGLISH = "english", _("English")
    RUSSIAN = "russian", _("Russian")
    JAPANESE = "japanese", _("Japanese")
    ARABIC = "arabic", _("Arabic")
    PERSIAN = "persian", _("Persian")
    ARMENIAN = "armenian", _("Armenian")
    KOREAN = "korean", _("Korean")
    VIETNAMESE = "vietnamese", _("Vietnamese")
    TAGALOG = "tagalog", _("Tagalog")
    CHINESE = "chinese", _("Chinese")
    SPANISH = "spanish", _("Spanish")


class YesNoPreferNotToSayEnum(models.TextChoices):
    YES = "yes", _("Yes")
    NO = "no", _("No")
    PREFER_NOT_TO_SAY = "prefer_not_to_say", _("Prefer not to say")

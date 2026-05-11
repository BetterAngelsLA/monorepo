from django.db import models
from django.utils.translation import gettext_lazy as _


class GeneralServicePermissions(models.TextChoices):
    ADD = "shelters.add_generalservice", _("Can add general service")
    CHANGE = "shelters.change_generalservice", _("Can change general service")
    DELETE = "shelters.delete_generalservice", _("Can delete general service")
    VIEW = "shelters.view_generalservice", _("Can view general service")


class HealthServicePermissions(models.TextChoices):
    ADD = "shelters.add_healthservice", _("Can add health service")
    CHANGE = "shelters.change_healthservice", _("Can change health service")
    DELETE = "shelters.delete_healthservice", _("Can delete health service")
    VIEW = "shelters.view_healthservice", _("Can view health service")


class ImmediateNeedPermissions(models.TextChoices):
    ADD = "shelters.add_immediateneed", _("Can add immediate need")
    CHANGE = "shelters.change_immediateneed", _("Can change immediate need")
    DELETE = "shelters.delete_immediateneed", _("Can delete immediate need")
    VIEW = "shelters.view_immediateneed", _("Can view immediate need")


class TrainingServicePermissions(models.TextChoices):
    ADD = "shelters.add_trainingservice", _("Can add training service")
    CHANGE = "shelters.change_trainingservice", _("Can change training service")
    DELETE = "shelters.delete_trainingservice", _("Can delete training service")
    VIEW = "shelters.view_trainingservice", _("Can view training service")


class MealServicePermissions(models.TextChoices):
    ADD = "shelters.add_mealservice", _("Can add meal service")
    CHANGE = "shelters.change_mealservice", _("Can change meal service")
    DELETE = "shelters.delete_mealservice", _("Can delete meal service")
    VIEW = "shelters.view_mealservice", _("Can view meal service")


class ExteriorPhotoPermissions(models.TextChoices):
    ADD = "shelters.add_exteriorphoto", _("Can add exterior photo")
    CHANGE = "shelters.change_exteriorphoto", _("Can change exterior photo")
    DELETE = "shelters.delete_exteriorphoto", _("Can delete exterior photo")
    VIEW = "shelters.view_exteriorphoto", _("Can view exterior photo")


class InteriorPhotoPermissions(models.TextChoices):
    ADD = "shelters.add_interiorphoto", _("Can add interior photo")
    CHANGE = "shelters.change_interiorphoto", _("Can change interior photo")
    DELETE = "shelters.delete_interiorphoto", _("Can delete interior photo")
    VIEW = "shelters.view_interiorphoto", _("Can view interior photo")

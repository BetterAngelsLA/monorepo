from django.db import models
from django.utils.translation import gettext_lazy as _


class SimpleModelPermissions(models.TextChoices):
    VIEW = "simplemodels.view_simplemodel", _("Can view simplemodel")
    CHANGE = "simplemodels.change_simplemodel", _("Can change simplemodel")
    DELETE = "simplemodels.delete_simplemodel", _("Can delete simplemodel")
    ADD = "simplemodels.add_simplemodel", _("Can add simplemodel")

# permissions.py

from django.db import models


class SimpleModelPermissions(models.TextChoices):
    VIEW = "simplemodels.view_simplemodel", "Can view simplemodel"
    CHANGE = "simplemodels.change_simplemodel", "Can change simplemodel"
    DELETE = "simplemodels.delete_simplemodel", "Can delete simplemodel"
    ADD = "simplemodels.add_simplemodel", "Can add simplemodel"

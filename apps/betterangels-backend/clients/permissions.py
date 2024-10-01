from django.db import models
from django.utils.translation import gettext_lazy as _


class ClientProfilePermissions(models.TextChoices):
    VIEW = "clients.view_clientprofile", _("Can view clientprofile")
    CHANGE = "clients.change_clientprofile", _("Can change clientprofile")
    DELETE = "clients.delete_clientprofile", _("Can delete clientprofile")
    ADD = "clients.add_clientprofile", _("Can add clientprofile")

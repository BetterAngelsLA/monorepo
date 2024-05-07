from django.db import models
from django.utils.translation import gettext_lazy as _


class ClientProfilePermissions(models.TextChoices):
    VIEW = "accounts.view_clientprofile", _("Can view clientprofile")
    CHANGE = "accounts.change_clientprofile", _("Can change clientprofile")
    DELETE = "accounts.delete_clientprofile", _("Can delete clientprofile")
    ADD = "accounts.add_clientprofile", _("Can add clientprofile")

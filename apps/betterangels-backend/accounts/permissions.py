from django.db import models
from django.utils.translation import gettext_lazy as _


class ClientPermissions(models.TextChoices):
    VIEW = "accounts.view_client", _("Can view client")
    CHANGE = "accounts.change_client", _("Can change client")
    DELETE = "accounts.delete_client", _("Can delete client")
    ADD = "accounts.add_client", _("Can add client")


class ClientProfilePermissions(models.TextChoices):
    VIEW = "accounts.view_clientprofile", _("Can view clientprofile")
    CHANGE = "accounts.change_clientprofile", _("Can change clientprofile")
    DELETE = "accounts.delete_clientprofile", _("Can delete clientprofile")
    ADD = "accounts.add_clientprofile", _("Can add clientprofile")

from django.db import models
from django.utils.translation import gettext_lazy as _


class ClientProfilePermissions(models.TextChoices):
    VIEW = "clients.view_clientprofile", _("Can view clientprofile")
    CHANGE = "clients.change_clientprofile", _("Can change clientprofile")
    DELETE = "clients.delete_clientprofile", _("Can delete clientprofile")
    ADD = "clients.add_clientprofile", _("Can add clientprofile")


class ClientProfileImportRecordPermissions(models.TextChoices):
    VIEW = "clients.view_clientprofileimportrecord", _("Can view client profile import record")
    CHANGE = "clients.change_clientprofileimportrecord", _("Can change client profile import record")
    DELETE = "clients.delete_clientprofileimportrecord", _("Can delete client profile import record")
    ADD = "clients.add_clientprofileimportrecord", _("Can add client profile import record")

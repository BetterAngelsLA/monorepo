from django.db import models
from django.utils.translation import gettext_lazy as _


class ClientProfilePermissions(models.TextChoices):
    VIEW = "clients.view_clientprofile", _("Can view clientprofile")
    CHANGE = "clients.change_clientprofile", _("Can change clientprofile")
    DELETE = "clients.delete_clientprofile", _("Can delete clientprofile")
    ADD = "clients.add_clientprofile", _("Can add clientprofile")


class ClientContactPermissions(models.TextChoices):
    VIEW = "clients.view_clientcontact", _("Can view clientcontact")
    CHANGE = "clients.change_clientcontact", _("Can change clientcontact")
    DELETE = "clients.delete_clientcontact", _("Can delete clientcontact")
    ADD = "clients.add_clientcontact", _("Can add clientcontact")


class ClientHouseholdMemberPermissions(models.TextChoices):
    VIEW = "clients.view_clienthouseholdmember", _("Can view clienthouseholdmember")
    CHANGE = "clients.change_clienthouseholdmember", _("Can change clienthouseholdmember")
    DELETE = "clients.delete_clienthouseholdmember", _("Can delete clienthouseholdmember")
    ADD = "clients.add_clienthouseholdmember", _("Can add clienthouseholdmember")


class HmisProfilePermissions(models.TextChoices):
    VIEW = "clients.view_hmisprofile", _("Can view hmisprofile")
    CHANGE = "clients.change_hmisprofile", _("Can change hmisprofile")
    DELETE = "clients.delete_hmisprofile", _("Can delete hmisprofile")
    ADD = "clients.add_hmisprofile", _("Can add hmisprofile")


class ClientProfileImportRecordPermissions(models.TextChoices):
    VIEW = "clients.view_clientprofileimportrecord", _("Can view client profile import record")
    CHANGE = "clients.change_clientprofileimportrecord", _("Can change client profile import record")
    DELETE = "clients.delete_clientprofileimportrecord", _("Can delete client profile import record")
    ADD = "clients.add_clientprofileimportrecord", _("Can add client profile import record")

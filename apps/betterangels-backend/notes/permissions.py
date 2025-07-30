from django.db import models
from django.utils.translation import gettext_lazy as _


class NotePermissions(models.TextChoices):
    VIEW = "notes.view_note", _("Can view note")
    CHANGE = "notes.change_note", _("Can change note")
    DELETE = "notes.delete_note", _("Can delete note")
    ADD = "notes.add_note", _("Can add note")


class PrivateDetailsPermissions(models.TextChoices):
    VIEW = "notes.view_note_private_details", _("Can view note private details")


class ServiceRequestPermissions(models.TextChoices):
    VIEW = "notes.view_servicerequest", _("Can view service request")
    CHANGE = "notes.change_servicerequest", _("Can change service request")
    DELETE = "notes.delete_servicerequest", _("Can delete service request")
    ADD = "notes.add_servicerequest", _("Can add service request")


# Data Import
class NoteImportRecordPermissions(models.TextChoices):
    VIEW = "notes.view_noteimportrecord", _("Can view note import record")
    CHANGE = "notes.change_noteimportrecord", _("Can change note import record")
    DELETE = "notes.delete_noteimportrecord", _("Can delete note import record")
    ADD = "notes.add_noteimportrecord", _("Can add note import record")

from django.db import models
from django.utils.translation import gettext_lazy as _


class NotePermissions(models.TextChoices):
    VIEW = "notes.view_note", _("Can add note")
    CHANGE = "notes.change_note", _("Can change note")
    DELETE = "notes.delete_note", _("Can delete note")
    ADD = "notes.add_note", _("Can view note")

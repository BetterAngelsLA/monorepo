from django.db import models
from django.utils.translation import gettext_lazy as _


class NotePermissions(models.TextChoices):
    VIEW = "notes.view_note", _("Can add note")
    CHANGE = "notes.change_note", _("Can change note")
    DELETE = "notes.delete_note", _("Can delete note")
    ADD = "notes.add_note", _("Can view note")


class PrivateNotePermissions(models.TextChoices):
    VIEW = "notes.view_note_private_details", _("Can view note private details")


class TaskPermissions(models.TextChoices):
    VIEW = "notes.view_task", _("Can add task")
    CHANGE = "notes.change_task", _("Can change task")
    DELETE = "notes.delete_task", _("Can delete task")
    ADD = "notes.add_task", _("Can view task")

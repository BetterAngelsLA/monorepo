from django.db import models


class NotePermissions(models.TextChoices):
    VIEW = "notes.view_note", "Can add note"
    CHANGE = "notes.change_note", "Can change note"
    DELETE = "notes.delete_note", "Can delete note"
    ADD = "notes.add_note", "Can view note"


class PrivateNotePermissions(models.TextChoices):
    VIEW = "notes.view_private_note", "Can add private note"
    CHANGE = "notes.change_private_note", "Can change private note"
    DELETE = "notes.delete_private_note", "Can delete private note"
    ADD = "notes.add_private_note", "Can view private note"

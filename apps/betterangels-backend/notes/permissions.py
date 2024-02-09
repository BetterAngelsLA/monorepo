from django.db import models


class NotePermissions(models.TextChoices):
    VIEW = "notes.view_note", "Can add note"
    CHANGE = "notes.change_note", "Can change note"
    DELETE = "notes.delete_note", "Can delete note"
    ADD = "notes.add_note", "Can view note"

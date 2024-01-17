# permissions.py

from enum import Enum


class NotePermissions(Enum):
    VIEW = "notesapp.view_note"
    CHANGE = "notesapp.change_note"
    DELETE = "notesapp.delete_note"

# permissions.py

from enum import Enum


class NotePermissions(Enum):
    VIEW = "notes.view_note"
    CHANGE = "notes.change_note"
    DELETE = "notes.delete_note"
    ADD = "notes.add_note"
